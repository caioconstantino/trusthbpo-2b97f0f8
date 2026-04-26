import { useState, useRef, useEffect } from "react";
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
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface ImportAlunosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AlunoImport {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco_cep?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  escola_nome: string;
  professor_nome: string;
  escola_id?: number;
  professor_id?: string;
  isValid: boolean;
  errors: string[];
}

interface Escola {
  id: number;
  nome: string;
}

interface Professor {
  id: string;
  nome: string;
  escola_id: number;
}

export function ImportAlunosDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportAlunosDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<AlunoImport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (open) {
      loadEscolasProfessores();
    }
  }, [open]);

  const loadEscolasProfessores = async () => {
    const [{ data: escolasData }, { data: profsData }] = await Promise.all([
      supabase.from("tb_escolas").select("id, nome").order("nome"),
      supabase.from("tb_professores").select("id, nome, escola_id").order("nome"),
    ]);
    setEscolas(escolasData || []);
    setProfessores(profsData || []);
  };

  const downloadTemplate = async () => {
    // Carregar escolas/professores para a aba de referência
    const escolasList = escolas.length
      ? escolas
      : (await supabase.from("tb_escolas").select("id, nome").order("nome")).data || [];
    const profsList = professores.length
      ? professores
      : (await supabase.from("tb_professores").select("id, nome, escola_id").order("nome")).data || [];

    const templateData = [
      {
        nome: "Aluno Exemplo",
        email: "aluno@exemplo.com",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        data_nascimento: "2000-01-15",
        endereco_cep: "01310-100",
        endereco_logradouro: "Av. Paulista",
        endereco_numero: "1000",
        endereco_complemento: "Apto 101",
        endereco_bairro: "Bela Vista",
        endereco_cidade: "São Paulo",
        endereco_estado: "SP",
        escola_nome: escolasList[0]?.nome || "Nome exato da escola",
        professor_nome: profsList[0]?.nome || "Nome exato do professor",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 8 },
      { wch: 30 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alunos");

    // Aba de referência: escolas e professores disponíveis
    const refData = profsList.map((p) => {
      const escola = escolasList.find((e) => e.id === p.escola_id);
      return {
        escola_nome: escola?.nome || "(escola não encontrada)",
        professor_nome: p.nome,
      };
    });
    if (refData.length === 0) {
      refData.push({ escola_nome: "Nenhuma escola/professor cadastrado", professor_nome: "-" });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    wsRef["!cols"] = [{ wch: 35 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRef, "Escolas e Professores");

    XLSX.writeFile(wb, "modelo_importacao_alunos.xlsx");

    toast({
      title: "Template baixado",
      description:
        "Use a aba 'Escolas e Professores' como referência para preencher os nomes corretos.",
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

      // Buscar emails existentes
      const { data: existingAlunos } = await supabase
        .from("tb_alunos")
        .select("email");
      const existingEmails = new Set(
        existingAlunos?.map((a) => a.email.toLowerCase()) || []
      );

      const mappedData: AlunoImport[] = jsonData.map((row) => {
        const errors: string[] = [];
        const nome = String(row.nome || "").trim();
        const email = String(row.email || "").trim().toLowerCase();
        const escolaNome = String(row.escola_nome || "").trim();
        const professorNome = String(row.professor_nome || "").trim();

        if (!nome) errors.push("Nome obrigatório");
        if (!email) errors.push("Email obrigatório");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          errors.push("Email inválido");
        else if (existingEmails.has(email)) errors.push("Email já cadastrado");

        if (!escolaNome) errors.push("Escola obrigatória");
        if (!professorNome) errors.push("Professor obrigatório");

        // Match escola
        const escola = escolas.find(
          (e) => e.nome.toLowerCase().trim() === escolaNome.toLowerCase()
        );
        if (escolaNome && !escola) errors.push("Escola não encontrada");

        // Match professor (dentro da escola)
        let professor: Professor | undefined;
        if (escola) {
          professor = professores.find(
            (p) =>
              p.nome.toLowerCase().trim() === professorNome.toLowerCase() &&
              p.escola_id === escola.id
          );
          if (professorNome && !professor)
            errors.push("Professor não encontrado nesta escola");
        }

        // Normalizar data
        let dataNascimento = "";
        if (row.data_nascimento) {
          const raw = row.data_nascimento;
          if (raw instanceof Date) {
            dataNascimento = raw.toISOString().split("T")[0];
          } else {
            const str = String(raw).trim();
            // Tentar dd/mm/yyyy
            const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (br) {
              dataNascimento = `${br[3]}-${br[2]}-${br[1]}`;
            } else if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
              dataNascimento = str.substring(0, 10);
            } else {
              dataNascimento = str;
            }
          }
        }

        return {
          nome,
          email,
          telefone: String(row.telefone || "").trim(),
          cpf: String(row.cpf || "").trim(),
          data_nascimento: dataNascimento,
          endereco_cep: String(row.endereco_cep || "").trim(),
          endereco_logradouro: String(row.endereco_logradouro || "").trim(),
          endereco_numero: String(row.endereco_numero || "").trim(),
          endereco_complemento: String(row.endereco_complemento || "").trim(),
          endereco_bairro: String(row.endereco_bairro || "").trim(),
          endereco_cidade: String(row.endereco_cidade || "").trim(),
          endereco_estado: String(row.endereco_estado || "").trim(),
          escola_nome: escolaNome,
          professor_nome: professorNome,
          escola_id: escola?.id,
          professor_id: professor?.id,
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
    const validAlunos = parsedData.filter((a) => a.isValid);

    if (validAlunos.length === 0) {
      toast({
        title: "Nenhum aluno válido",
        description: "Corrija os erros e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validAlunos.length });

    let successCount = 0;
    let failCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < validAlunos.length; i++) {
      const aluno = validAlunos[i];
      setImportProgress({ current: i + 1, total: validAlunos.length });

      try {
        const { data, error } = await supabase.functions.invoke(
          "create-aluno-empresa",
          {
            body: {
              professor_id: aluno.professor_id,
              escola_id: aluno.escola_id,
              nome: aluno.nome,
              email: aluno.email,
              telefone: aluno.telefone || undefined,
              cpf: aluno.cpf || undefined,
              data_nascimento: aluno.data_nascimento || undefined,
              endereco_cep: aluno.endereco_cep || undefined,
              endereco_logradouro: aluno.endereco_logradouro || undefined,
              endereco_numero: aluno.endereco_numero || undefined,
              endereco_complemento: aluno.endereco_complemento || undefined,
              endereco_bairro: aluno.endereco_bairro || undefined,
              endereco_cidade: aluno.endereco_cidade || undefined,
              endereco_estado: aluno.endereco_estado || undefined,
            },
          }
        );

        if (error || (data as any)?.error) {
          failCount++;
          failures.push(`${aluno.email}: ${error?.message || (data as any)?.error}`);
        } else {
          successCount++;
        }
      } catch (err: any) {
        failCount++;
        failures.push(`${aluno.email}: ${err.message}`);
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast({
        title: "Importação concluída",
        description: `${successCount} aluno(s) importado(s) com sucesso.${
          failCount > 0 ? ` ${failCount} falha(s).` : ""
        }`,
      });
    }

    if (failCount > 0) {
      console.error("Falhas na importação:", failures);
      if (successCount === 0) {
        toast({
          title: "Erro na importação",
          description: `Todas as ${failCount} importações falharam. Veja o console.`,
          variant: "destructive",
        });
      }
    }

    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setParsedData([]);
    setStep("upload");
    setImportProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const validCount = parsedData.filter((a) => a.isValid).length;
  const invalidCount = parsedData.filter((a) => !a.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Alunos via XLSX
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="bg-slate-700/50 rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  1. Baixe o modelo de importação
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  O modelo inclui uma aba com os nomes exatos das escolas e
                  professores cadastrados
                </p>
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Modelo XLSX
              </Button>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  2. Envie o arquivo preenchido
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Cada aluno terá uma empresa educacional criada automaticamente e
                  receberá um email para ativar a conta
                </p>
              </div>
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="aluno-file-upload"
                />
                <Label htmlFor="aluno-file-upload">
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

            <div className="bg-slate-700/30 rounded-lg p-4 text-sm text-slate-400">
              <strong className="text-slate-300">Campos obrigatórios:</strong> nome,
              email, escola_nome, professor_nome.
              <br />
              <strong className="text-slate-300">Importante:</strong> os nomes da
              escola e do professor devem ser exatamente iguais aos cadastrados no
              sistema.
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-green-500/10 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-green-400">{validCount}</p>
                  <p className="text-sm text-slate-400">Alunos válidos</p>
                </div>
              </div>
              {invalidCount > 0 && (
                <div className="flex-1 bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      {invalidCount}
                    </p>
                    <p className="text-sm text-slate-400">Com erros</p>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="h-[300px] rounded-lg border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-400 w-10">Status</TableHead>
                    <TableHead className="text-slate-400">Nome</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Escola</TableHead>
                    <TableHead className="text-slate-400">Professor</TableHead>
                    <TableHead className="text-slate-400">Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((aluno, index) => (
                    <TableRow
                      key={index}
                      className={`border-slate-700 ${
                        aluno.isValid ? "" : "bg-red-500/5"
                      }`}
                    >
                      <TableCell>
                        {aluno.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {aluno.nome}
                      </TableCell>
                      <TableCell className="text-slate-300">{aluno.email}</TableCell>
                      <TableCell className="text-slate-300">
                        {aluno.escola_nome}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {aluno.professor_nome}
                      </TableCell>
                      <TableCell className="text-red-400 text-sm">
                        {aluno.errors.join(", ") || "-"}
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
                  {invalidCount} registro(s) com erro(s) não serão importados.
                  Corrija o arquivo e tente novamente se desejar importá-los.
                </p>
              </div>
            )}

            {isImporting && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                <p className="text-sm text-primary">
                  Importando {importProgress.current} de {importProgress.total}...
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "preview" && !isImporting && (
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
            disabled={isImporting}
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
                  Importar {validCount} Aluno(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
