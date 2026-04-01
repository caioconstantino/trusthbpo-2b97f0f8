import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, ImageIcon, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import JSZip from "jszip";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface MappingRow {
  codigo: string;
  imagem: string;
}

interface UploadResult {
  codigo: string;
  imagem: string;
  status: "success" | "error";
  message: string;
}

export function ImportImagensProdutosDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<MappingRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const xlsxRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["codigo", "imagem"],
      ["PROD001", "foto_produto1.jpg"],
      ["PROD002", "foto_produto2.png"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mapeamento");
    XLSX.writeFile(wb, "modelo_imagens_produtos.xlsx");
  };

  const handleXlsxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
      const rows: MappingRow[] = data
        .filter((r) => r.codigo && r.imagem)
        .map((r) => ({ codigo: String(r.codigo).trim(), imagem: String(r.imagem).trim() }));
      setMapping(rows);
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = async () => {
    if (!zipFile || mapping.length === 0) return;

    setIsProcessing(true);
    setStep("preview");
    setProgress(0);
    const uploadResults: UploadResult[] = [];

    try {
      const dominio = localStorage.getItem("user_dominio");
      if (!dominio) throw new Error("Domínio não encontrado");

      const zip = await JSZip.loadAsync(zipFile);
      const total = mapping.length;

      for (let i = 0; i < total; i++) {
        const row = mapping[i];
        try {
          // Find image in zip (case insensitive, handle nested folders)
          let zipEntry: JSZip.JSZipObject | null = null;
          zip.forEach((path, entry) => {
            if (!entry.dir) {
              const filename = path.split("/").pop() || "";
              if (filename.toLowerCase() === row.imagem.toLowerCase()) {
                zipEntry = entry;
              }
            }
          });

          if (!zipEntry) {
            uploadResults.push({ codigo: row.codigo, imagem: row.imagem, status: "error", message: "Imagem não encontrada no ZIP" });
            setProgress(((i + 1) / total) * 100);
            continue;
          }

          const blob = await (zipEntry as JSZip.JSZipObject).async("blob");
          const ext = row.imagem.split(".").pop()?.toLowerCase() || "jpg";
          const filePath = `${dominio}/${row.codigo}.${ext}`;

          // Upload to storage (upsert)
          const { error: uploadError } = await supabase.storage
            .from("produtos")
            .upload(filePath, blob, { upsert: true, contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(filePath);

          // Update product
          const { error: updateError } = await supabase
            .from("tb_produtos")
            .update({ imagem_url: urlData.publicUrl })
            .eq("codigo", row.codigo)
            .eq("dominio", dominio);

          if (updateError) throw updateError;

          uploadResults.push({ codigo: row.codigo, imagem: row.imagem, status: "success", message: "Imagem importada" });
        } catch (err: any) {
          uploadResults.push({ codigo: row.codigo, imagem: row.imagem, status: "error", message: err.message || "Erro desconhecido" });
        }
        setProgress(((i + 1) / total) * 100);
      }

      setResults(uploadResults);
      setStep("done");

      const successCount = uploadResults.filter((r) => r.status === "success").length;
      toast({
        title: "Importação concluída",
        description: `${successCount} de ${total} imagens importadas com sucesso.`,
      });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setXlsxFile(null);
    setZipFile(null);
    setMapping([]);
    setResults([]);
    setStep("upload");
    setProgress(0);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Importar Imagens de Produtos
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo XLSX com o mapeamento (código → imagem) e um ZIP com as fotos.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar modelo XLSX
            </Button>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Arquivo XLSX (mapeamento)</label>
                <input ref={xlsxRef} type="file" accept=".xlsx,.xls" onChange={handleXlsxChange} className="block w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                {mapping.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{mapping.length} mapeamento(s) encontrado(s)</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Arquivo ZIP (imagens)</label>
                <input ref={zipRef} type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] || null)} className="block w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
            </div>

            {mapping.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Imagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapping.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.codigo}</td>
                        <td className="px-3 py-2">{row.imagem}</td>
                      </tr>
                    ))}
                    {mapping.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={2} className="px-3 py-2 text-muted-foreground text-center">
                          ...e mais {mapping.length - 10} itens
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <Button onClick={handleProcess} disabled={!xlsxFile || !zipFile || mapping.length === 0} className="w-full gap-2">
              <Upload className="w-4 h-4" />
              Processar Importação ({mapping.length} imagens)
            </Button>
          </div>
        )}

        {step === "preview" && isProcessing && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Processando imagens...</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}% concluído</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> {successCount} sucesso
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="w-3 h-3" /> {errorCount} erro(s)
                </Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-mono">{r.codigo}</td>
                      <td className="px-3 py-2">
                        {r.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={() => handleClose(false)} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
