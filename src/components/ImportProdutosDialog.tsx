import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface ImportProdutosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ProdutoImport {
  nome: string;
  codigo?: string;
  codigo_barras?: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  categoria?: string;
  observacao?: string;
  isValid: boolean;
  errors: string[];
}

export function ImportProdutosDialog({ open, onOpenChange, onSuccess }: ImportProdutosDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProdutoImport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const downloadTemplate = () => {
    const templateData = [
      {
        nome: "Produto Exemplo",
        codigo: "PROD001",
        codigo_barras: "7891234567890",
        tipo: "padrao",
        preco_custo: 10.00,
        preco_venda: 25.90,
        categoria: "Categoria 1",
        observacao: "Observação do produto"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    ws["!cols"] = [
      { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 30 },
    ];
    XLSX.writeFile(wb, "modelo_importacao_produtos.xlsx");
    toast({ title: "Template baixado", description: "Preencha o arquivo e faça o upload para importar os produtos." });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      const mappedData: ProdutoImport[] = jsonData.map((row) => {
        const errors: string[] = [];
        const nome = String(row.nome || "").trim();
        const tipo = String(row.tipo || "padrao").trim().toLowerCase();
        const precoCusto = parseFloat(String(row.preco_custo || "0").replace(",", ".")) || 0;
        const precoVenda = parseFloat(String(row.preco_venda || "0").replace(",", ".")) || 0;

        if (!nome) errors.push("Nome obrigatório");
        if (!["padrao", "servico"].includes(tipo)) errors.push("Tipo inválido (padrao/servico)");
        if (precoVenda < 0) errors.push("Preço venda inválido");

        return {
          nome,
          codigo: String(row.codigo || "").trim() || undefined,
          codigo_barras: String(row.codigo_barras || "").trim() || undefined,
          tipo,
          preco_custo: precoCusto,
          preco_venda: precoVenda,
          categoria: String(row.categoria || "").trim() || undefined,
          observacao: String(row.observacao || "").trim() || undefined,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedData(mappedData);
      setStep("preview");
    } catch (error: any) {
      toast({ title: "Erro ao ler arquivo", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const validProdutos = parsedData.filter(p => p.isValid);
    if (validProdutos.length === 0) {
      toast({ title: "Nenhum produto válido", description: "Corrija os erros e tente novamente.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    const dominio = localStorage.getItem("user_dominio");
    const unidadeId = localStorage.getItem("unidade_ativa_id");

    if (!dominio) {
      toast({ title: "Erro", description: "Domínio não encontrado.", variant: "destructive" });
      setIsImporting(false);
      return;
    }

    try {
      // Resolve categories: fetch existing and create missing
      const uniqueCategories = [...new Set(validProdutos.map(p => p.categoria).filter(Boolean))] as string[];
      const categoryMap: Record<string, number> = {};

      if (uniqueCategories.length > 0) {
        const { data: existingCats } = await supabase
          .from("tb_categorias")
          .select("id, nome")
          .eq("dominio", dominio);

        for (const cat of existingCats || []) {
          categoryMap[cat.nome.toLowerCase()] = cat.id;
        }

        for (const catName of uniqueCategories) {
          if (!categoryMap[catName.toLowerCase()]) {
            const { data: newCat } = await supabase
              .from("tb_categorias")
              .insert({ nome: catName, dominio, unidade_id: unidadeId ? parseInt(unidadeId) : null })
              .select("id")
              .single();
            if (newCat) categoryMap[catName.toLowerCase()] = newCat.id;
          }
        }
      }

      const insertData = validProdutos.map(p => ({
        nome: p.nome,
        codigo: p.codigo || null,
        codigo_barras: p.codigo_barras || null,
        tipo: p.tipo,
        preco_custo: p.preco_custo,
        preco_venda: p.preco_venda,
        categoria_id: p.categoria ? categoryMap[p.categoria.toLowerCase()] || null : null,
        observacao: p.observacao || null,
        dominio,
        unidade_id: unidadeId ? parseInt(unidadeId) : null,
        ativo: true,
      }));

      const { error } = await supabase.from("tb_produtos").insert(insertData);
      if (error) throw error;

      toast({ title: "Importação concluída", description: `${validProdutos.length} produto(s) importado(s) com sucesso.` });
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const validCount = parsedData.filter(p => p.isValid).length;
  const invalidCount = parsedData.filter(p => !p.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Produtos via XLSX
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="bg-muted rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">1. Baixe o modelo de importação</h3>
                <p className="text-sm text-muted-foreground mt-1">Use o modelo para garantir que os dados estejam no formato correto</p>
              </div>
              <Button onClick={downloadTemplate} variant="outline" className="border-green-500/50 text-green-600 hover:bg-green-500/10">
                <Download className="w-4 h-4 mr-2" /> Baixar Modelo XLSX
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">2. Envie o arquivo preenchido</h3>
                <p className="text-sm text-muted-foreground mt-1">Selecione o arquivo XLSX com os dados dos produtos</p>
              </div>
              <div>
                <Input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload-produtos" />
                <Label htmlFor="file-upload-produtos">
                  <Button asChild variant="default" disabled={isLoading}>
                    <span>
                      {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>) : (<><Upload className="w-4 h-4 mr-2" />Selecionar Arquivo</>)}
                    </span>
                  </Button>
                </Label>
                {file && <p className="text-sm text-muted-foreground mt-2">Arquivo: {file.name}</p>}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tipos válidos:</strong> padrao, servico | <strong>Categorias:</strong> serão criadas automaticamente se não existirem
              </p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-green-500/10 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{validCount}</p>
                  <p className="text-sm text-muted-foreground">Produtos válidos</p>
                </div>
              </div>
              {invalidCount > 0 && (
                <div className="flex-1 bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-500">{invalidCount}</p>
                    <p className="text-sm text-muted-foreground">Com erros</p>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((prod, i) => (
                    <TableRow key={i} className={prod.isValid ? "" : "bg-destructive/5"}>
                      <TableCell>
                        {prod.isValid ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                      </TableCell>
                      <TableCell className="font-medium">{prod.nome}</TableCell>
                      <TableCell>{prod.codigo || "-"}</TableCell>
                      <TableCell>{prod.tipo}</TableCell>
                      <TableCell>{prod.preco_custo.toFixed(2)}</TableCell>
                      <TableCell>{prod.preco_venda.toFixed(2)}</TableCell>
                      <TableCell>{prod.categoria || "-"}</TableCell>
                      <TableCell className="text-destructive text-sm">{prod.errors.join(", ") || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {invalidCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {invalidCount} registro(s) com erro(s) não serão importados.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "preview" && (
            <Button variant="outline" onClick={() => { setStep("upload"); setParsedData([]); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
              Voltar
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          {step === "preview" && (
            <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
              {isImporting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>) : (<><Upload className="w-4 h-4 mr-2" />Importar {validCount} Produto(s)</>)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
