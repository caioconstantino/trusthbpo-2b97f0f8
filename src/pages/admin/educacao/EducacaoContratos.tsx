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
import { AvaliacaoDocenteForm, type AvaliacaoDocente } from "@/components/educacao/AvaliacaoDocenteForm";
import { Separator } from "@/components/ui/separator";

interface Contrato {
  id: string;
  empresa_id: string;
  numero: string | null;
  data_inicio: string;
  data_fim: string | null;
  valor_mensal_por_estagiario: number;
  status: string;
  observacoes: string | null;
  dados_avaliacao?: AvaliacaoDocente | null;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty: Partial<Contrato> = { numero: "", data_inicio: new Date().toISOString().slice(0, 10), data_fim: null, valor_mensal_por_estagiario: 0, status: "ativo", observacoes: "", dados_avaliacao: {} };

const EducacaoContratos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; razao_social: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Contrato>>(empty);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([
      supabase.from("tb_edu_contratos").select("*").order("data_inicio", { ascending: false }),
      supabase.from("tb_edu_empresas").select("id,razao_social").order("razao_social"),
    ]);
    setContratos((cRes.data as any) || []);
    setEmpresas((eRes.data as any) || []);
    setLoading(false);
  };

  const empresaNome = (id: string) => empresas.find((e) => e.id === id)?.razao_social || "-";

  const save = async () => {
    if (!form.empresa_id || !form.data_inicio) {
      toast({ title: "Empresa e data de início são obrigatórios", variant: "destructive" }); return;
    }
    const payload: any = { ...form, valor_mensal_por_estagiario: Number(form.valor_mensal_por_estagiario || 0) };
    if (!payload.data_fim) payload.data_fim = null;
    if (!payload.dados_avaliacao) payload.dados_avaliacao = {};
    const res = form.id
      ? await supabase.from("tb_edu_contratos").update(payload).eq("id", form.id)
      : await supabase.from("tb_edu_contratos").insert(payload);
    if (res.error) { toast({ title: "Erro", description: res.error.message, variant: "destructive" }); return; }
    toast({ title: "Contrato salvo" });
    setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este contrato?")) return;
    const { error } = await supabase.from("tb_edu_contratos").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contrato excluído" }); load();
  };

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contratos</h1>
            <p className="text-slate-400">{contratos.length} contratos</p>
          </div>
          <Button onClick={() => { setForm(empty); setOpen(true); }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Novo contrato
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Número</TableHead>
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Vigência</TableHead>
                  <TableHead className="text-slate-400">Valor/estagiário</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{c.numero || c.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-slate-300">{empresaNome(c.empresa_id)}</TableCell>
                    <TableCell className="text-slate-300">{c.data_inicio} {c.data_fim ? `→ ${c.data_fim}` : "(em aberto)"}</TableCell>
                    <TableCell className="text-slate-300">{fmt(Number(c.valor_mensal_por_estagiario))}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(c); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {contratos.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Nenhum contrato</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Editar contrato" : "Novo contrato"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Empresa *</Label>
                <Select value={form.empresa_id} onValueChange={(v) => setForm({ ...form, empresa_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Número</Label><Input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
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
              <div><Label>Data de início *</Label><Input type="date" value={form.data_inicio || ""} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
              <div><Label>Data fim</Label><Input type="date" value={form.data_fim || ""} onChange={(e) => setForm({ ...form, data_fim: e.target.value || null })} /></div>
              <div className="col-span-2"><Label>Valor mensal por estagiário (R$)</Label><Input type="number" step="0.01" value={form.valor_mensal_por_estagiario ?? 0} onChange={(e) => setForm({ ...form, valor_mensal_por_estagiario: Number(e.target.value) })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            </div>
            <Separator className="my-4" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Avaliação do Docente</h3>
              <AvaliacaoDocenteForm
                value={(form.dados_avaliacao as AvaliacaoDocente) || {}}
                onChange={(av) => setForm({ ...form, dados_avaliacao: av })}
              />
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

export default EducacaoContratos;
