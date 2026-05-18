import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface Estagio {
  id: string;
  aluno_id: string;
  empresa_id: string;
  contrato_id: string;
  data_inicio: string;
  data_fim: string | null;
  valor_mensal: number;
  status: string;
  observacoes: string | null;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty: Partial<Estagio> = { data_inicio: new Date().toISOString().slice(0, 10), data_fim: null, valor_mensal: 0, status: "ativo", observacoes: "" };

const EducacaoEstagios = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [alunos, setAlunos] = useState<{ id: string; nome: string }[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; razao_social: string }[]>([]);
  const [contratos, setContratos] = useState<{ id: string; numero: string | null; empresa_id: string; valor_mensal_por_estagiario: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Estagio>>(empty);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativo");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [es, al, em, co] = await Promise.all([
      supabase.from("tb_edu_estagios").select("*").order("created_at", { ascending: false }),
      supabase.from("tb_alunos").select("id,nome").order("nome"),
      supabase.from("tb_edu_empresas").select("id,razao_social").order("razao_social"),
      supabase.from("tb_edu_contratos").select("id,numero,empresa_id,valor_mensal_por_estagiario"),
    ]);
    setEstagios((es.data as any) || []);
    setAlunos((al.data as any) || []);
    setEmpresas((em.data as any) || []);
    setContratos((co.data as any) || []);
    setLoading(false);
  };

  const alunoNome = (id: string) => alunos.find(a => a.id === id)?.nome || "-";
  const empresaNome = (id: string) => empresas.find(e => e.id === id)?.razao_social || "-";
  const contratosDaEmpresa = contratos.filter(c => c.empresa_id === form.empresa_id);

  const onSelectContrato = (id: string) => {
    const c = contratos.find(x => x.id === id);
    setForm({ ...form, contrato_id: id, valor_mensal: c?.valor_mensal_por_estagiario ?? form.valor_mensal });
  };

  const save = async () => {
    if (!form.aluno_id || !form.empresa_id || !form.contrato_id || !form.data_inicio) {
      toast({ title: "Aluno, empresa, contrato e data de início obrigatórios", variant: "destructive" }); return;
    }
    const payload: any = { ...form, valor_mensal: Number(form.valor_mensal || 0) };
    if (!payload.data_fim) payload.data_fim = null;
    const res = form.id
      ? await supabase.from("tb_edu_estagios").update(payload).eq("id", form.id)
      : await supabase.from("tb_edu_estagios").insert(payload);
    if (res.error) { toast({ title: "Erro", description: res.error.message, variant: "destructive" }); return; }
    toast({ title: "Estágio salvo" });
    setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este estágio?")) return;
    const { error } = await supabase.from("tb_edu_estagios").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Estágio excluído" }); load();
  };

  const filtered = estagios.filter(e => filtroStatus === "todos" ? true : e.status === filtroStatus);

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Estágios</h1>
            <p className="text-slate-400">{filtered.length} de {estagios.length}</p>
          </div>
          <div className="flex gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-800 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="suspenso">Suspensos</SelectItem>
                <SelectItem value="encerrado">Encerrados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setForm(empty); setOpen(true); }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Novo estágio
            </Button>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Aluno</TableHead>
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Vigência</TableHead>
                  <TableHead className="text-slate-400">Valor mensal</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{alunoNome(e.aluno_id)}</TableCell>
                    <TableCell className="text-slate-300">{empresaNome(e.empresa_id)}</TableCell>
                    <TableCell className="text-slate-300">{e.data_inicio} {e.data_fim ? `→ ${e.data_fim}` : "(em aberto)"}</TableCell>
                    <TableCell className="text-slate-300">{fmt(Number(e.valor_mensal))}</TableCell>
                    <TableCell><Badge variant={e.status === "ativo" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(e); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Nenhum estágio</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? "Editar estágio" : "Novo estágio"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Aluno *</Label>
                <Select value={form.aluno_id} onValueChange={(v) => setForm({ ...form, aluno_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="max-h-64">{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Empresa *</Label>
                <Select value={form.empresa_id} onValueChange={(v) => setForm({ ...form, empresa_id: v, contrato_id: undefined })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contrato *</Label>
                <Select value={form.contrato_id} onValueChange={onSelectContrato} disabled={!form.empresa_id}>
                  <SelectTrigger><SelectValue placeholder={form.empresa_id ? "Selecione" : "Escolha empresa primeiro"} /></SelectTrigger>
                  <SelectContent>{contratosDaEmpresa.map(c => <SelectItem key={c.id} value={c.id}>{c.numero || c.id.slice(0, 8)} — {fmt(Number(c.valor_mensal_por_estagiario))}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data de início *</Label><Input type="date" value={form.data_inicio || ""} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
              <div><Label>Data fim</Label><Input type="date" value={form.data_fim || ""} onChange={(e) => setForm({ ...form, data_fim: e.target.value || null })} /></div>
              <div><Label>Valor mensal (R$)</Label><Input type="number" step="0.01" value={form.valor_mensal ?? 0} onChange={(e) => setForm({ ...form, valor_mensal: Number(e.target.value) })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EducacaoAdminLayout>
  );
};

export default EducacaoEstagios;
