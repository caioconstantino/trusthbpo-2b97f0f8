import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { z } from "zod";

const AREAS = [
  "Administração",
  "Financeiro",
  "Comercial / Vendas",
  "Marketing",
  "Tecnologia / TI",
  "Recursos Humanos",
  "Logística / Estoque",
  "Atendimento ao Cliente",
  "Design",
  "Outros",
];

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  telefone: z.string().trim().max(30).optional(),
  mensagem: z.string().trim().max(1000).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EstagioFormDialog = ({ open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const toggleArea = (a: string) => {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const reset = () => {
    setNome(""); setEmail(""); setTelefone(""); setMensagem(""); setAreas([]); setArquivo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ nome, email, telefone, mensagem });
    if (!parsed.success) {
      toast({ title: "Verifique os dados", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (areas.length === 0) {
      toast({ title: "Selecione ao menos uma área de interesse", variant: "destructive" });
      return;
    }
    if (!arquivo) {
      toast({ title: "Anexe seu currículo", variant: "destructive" });
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      toast({ title: "Currículo muito grande (máx 5MB)", variant: "destructive" });
      return;
    }
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(arquivo.type)) {
      toast({ title: "Formato inválido", description: "Envie PDF ou Word", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const ext = arquivo.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("curriculos").upload(path, arquivo, {
        contentType: arquivo.type,
      });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("tb_estagios_candidatos").insert({
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone || null,
        mensagem: parsed.data.mensagem || null,
        areas_interesse: areas,
        curriculo_url: path,
      });
      if (insErr) throw insErr;

      toast({ title: "Candidatura enviada!", description: "Em breve entraremos em contato." });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quero estagiar na TrustHBPO</DialogTitle>
          <DialogDescription>
            Envie seu currículo e selecione suas áreas de interesse. Retornaremos por email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="est-nome">Nome completo *</Label>
              <Input id="est-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-email">Email *</Label>
              <Input id="est-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-tel">Telefone / WhatsApp</Label>
            <Input id="est-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={30} />
          </div>

          <div className="space-y-2">
            <Label>Áreas de interesse *</Label>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted">
                  <Checkbox checked={areas.includes(a)} onCheckedChange={() => toggleArea(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="est-msg">Mensagem (opcional)</Label>
            <Textarea id="est-msg" value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={1000} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="est-cv">Currículo (PDF ou Word, máx 5MB) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="est-cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {arquivo && <p className="text-xs text-muted-foreground">{arquivo.name}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar candidatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};