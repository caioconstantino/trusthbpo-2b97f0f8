import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface ImportClientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ClienteImport {
  dominio: string;
  razao_social: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  status: string;
  plano?: string;
  responsavel?: string;
  observacoes?: string;
  isValid: boolean;
  errors: string[];
}

export function ImportClientesDialog({ open, onOpenChange, onSuccess }: ImportClientesDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ClienteImport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const downloadTemplate = () => {
    // Criar dados do template
    const templateData = [
      {
        dominio: "exemplo-empresa",
        razao_social: "Empresa Exemplo LTDA",
        cpf_cnpj: "12.345.678/0001-90",
        email: "contato@exemplo.com",
        telefone: "(11) 99999-9999",
        status: "Lead",
        plano: "Essencial",
        responsavel: "",
        observacoes: "Cliente importado via planilha"
      }
    ];

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");

    // Ajustar largura das colunas
    ws["!cols"] = [
      { wch: 20 }, // dominio
      { wch: 30 }, // razao_social
      { wch: 20 }, // cpf_cnpj
      { wch: 30 }, // email
      { wch: 18 }, // telefone
      { wch: 12 }, // status
      { wch: 15 }, // plano
      { wch: 20 }, // responsavel
      { wch: 40 }, // observacoes
    ];

    // Download
    XLSX.writeFile(wb, "modelo_importacao_clientes.xlsx");
    
    toast({
      title: "Template baixado",
      description: "Preencha o arquivo e faça o upload para importar os clientes.",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      // Buscar domínios existentes
      const { data: existingClientes } = await supabase
        .from("tb_clientes_saas")
        .select("dominio");
      
      const existingDominios = new Set(existingClientes?.map(c => c.dominio.toLowerCase()) || []);

      // Validar e mapear dados
      const mappedData: ClienteImport[] = jsonData.map((row) => {
        const errors: string[] = [];
        const dominio = String(row.dominio || "").trim().toLowerCase().replace(/\s+/g, "-");
        const razaoSocial = String(row.razao_social || "").trim();
        const status = String(row.status || "Lead").trim();

        if (!dominio) errors.push("Domínio obrigatório");
        if (!razaoSocial) errors.push("Razão social obrigatória");
        if (existingDominios.has(dominio)) errors.push("Domínio já existe");
        if (!["Lead", "Ativo", "Inativo", "Suspenso", "Cancelado", "Inadimplente"].includes(status)) {
          errors.push("Status inválido");
        }

        return {
          dominio,
          razao_social: razaoSocial,
          cpf_cnpj: String(row.cpf_cnpj || "").trim(),
          email: String(row.email || "").trim(),
          telefone: String(row.telefone || "").trim(),
          status,
          plano: String(row.plano || "").trim() || null,
          responsavel: String(row.responsavel || "").trim() || null,
          observacoes: String(row.observacoes || "").trim() || null,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedData(mappedData);
      setStep("preview");
    } catch (error: any) {
      toast({
        title: "Erro ao ler arquivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const validClientes = parsedData.filter(c => c.isValid);
    
    if (validClientes.length === 0) {
      toast({
        title: "Nenhum cliente válido",
        description: "Corrija os erros e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const { error } = await supabase.from("tb_clientes_saas").insert(
        validClientes.map(c => ({
          dominio: c.dominio,
          razao_social: c.razao_social,
          cpf_cnpj: c.cpf_cnpj || null,
          email: c.email || null,
          telefone: c.telefone || null,
          status: c.status,
          plano: c.plano,
          responsavel: c.responsavel,
          observacoes: c.observacoes,
        }))
      );

      if (error) throw error;

      toast({
        title: "Importação concluída",
        description: `${validClientes.length} cliente(s) importado(s) com sucesso.`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
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

  const validCount = parsedData.filter(c => c.isValid).length;
  const invalidCount = parsedData.filter(c => !c.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Clientes via XLSX
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            {/* Download Template */}
            <div className="bg-slate-700/50 rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">1. Baixe o modelo de importação</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Use o modelo para garantir que os dados estejam no formato correto
                </p>
              </div>
              <Button onClick={downloadTemplate} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                <Download className="w-4 h-4 mr-2" />
                Baixar Modelo XLSX
              </Button>
            </div>

            {/* Upload File */}
            <div className="bg-slate-700/50 rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">2. Envie o arquivo preenchido</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Selecione o arquivo XLSX com os dados dos clientes
                </p>
              </div>
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button asChild variant="default" disabled={isLoading}>
                    <span>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar Arquivo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                {file && (
                  <p className="text-sm text-slate-400 mt-2">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Status válidos */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <p className="text-sm text-slate-400">
                <strong>Status válidos:</strong> Lead, Ativo, Inativo, Suspenso, Cancelado, Inadimplente
              </p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="flex gap-4">
              <div className="flex-1 bg-green-500/10 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{validCount}</p>
                  <p className="text-sm text-slate-400">Clientes válidos</p>
                </div>
              </div>
              {invalidCount > 0 && (
                <div className="flex-1 bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-red-400">{invalidCount}</p>
                    <p className="text-sm text-slate-400">Com erros</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <ScrollArea className="h-[300px] rounded-lg border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-400 w-10">Status</TableHead>
                    <TableHead className="text-slate-400">Domínio</TableHead>
                    <TableHead className="text-slate-400">Razão Social</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((cliente, index) => (
                    <TableRow key={index} className={`border-slate-700 ${cliente.isValid ? "" : "bg-red-500/5"}`}>
                      <TableCell>
                        {cliente.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-white font-medium">{cliente.dominio}</TableCell>
                      <TableCell className="text-slate-300">{cliente.razao_social}</TableCell>
                      <TableCell className="text-slate-300">{cliente.email || "-"}</TableCell>
                      <TableCell className="text-slate-300">{cliente.status}</TableCell>
                      <TableCell className="text-red-400 text-sm">
                        {cliente.errors.join(", ") || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {invalidCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  {invalidCount} registro(s) com erro(s) não serão importados. Corrija o arquivo e tente novamente se desejar importá-los.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "preview" && (
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setParsedData([]);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Voltar
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            Cancelar
          </Button>
          {step === "preview" && (
            <Button
              onClick={handleImport}
              disabled={isImporting || validCount === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {validCount} Cliente(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
