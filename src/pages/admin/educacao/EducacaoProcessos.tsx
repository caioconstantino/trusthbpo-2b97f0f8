import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Users, X, Save } from "lucide-react";

interface Processo {
  id: string;
  empresa_id: string;
  contrato_id: string | null;
  qtd_vagas: number;
  valor_total: number;
  coluna: string;
  ordem: number;
  observacoes: string | null;
  data_solicitacao: string;
  data_pagamento: string | null;
}

interface Candidato { id: string; processo_id: string; aluno_id: string; status: string; }

const COLUNAS = [
  { id: "solicitacao", label: "Solicitação recebida", color: "border-slate-500" },
  { id: "aguardando_pagamento", label: "Aguardando pagamento", color: "border-yellow-500" },
  { id: "pago_selecionar", label: "Pago — selecionar estagiários", color: "border-blue-500" },
  { id: "em_entrevista", label: "Em entrevista", color: "border-purple-500" },
  { id: "contratado", label: "Contratado / ativo", color: "border-green-500" },
  { id: "cancelado", label: "Cancelado", color: "border-red-500" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const empty: Partial<Processo> = { qtd_vagas: 1, valor_total: 0, coluna: "solicitacao", data_solicitacao: new Date().toISOString().slice(0,10) };

const EducacaoProcessos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; razao_social: string }[]>([]);
  const [contratos, setContratos] = useState<{ id: string; numero: string | null; empresa_id: string; valor_mensal_por_estagiario: number }[]>([]);
  const [alunos, setAlunos] = useState<{ id: string; nome: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Processo>>(empty);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Processo>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [pr, ca, em, co, al] = await Promise.all([
      supabase.from("tb_edu_processos").select("*").order("ordem"),
      supabase.from("tb_edu_processos_candidatos").select("*"),
      supabase.from("tb_edu_empresas").select("id,razao_social").order("razao_social"),
      supabase.from("tb_edu_contratos").select("id,numero,empresa_id,valor_mensal_por_estagiario"),
      supabase.from("tb_alunos").select("id,nome").order("nome"),
    ]);
    setProcessos((pr.data as any) || []);
    setCandidatos((ca.data as any) || []);
    setEmpresas((em.data as any) || []);
    setContratos((co.data as any) || []);
    setAlunos((al.data as any) || []);
    setLoading(false);
  };

  const empresaNome = (id: string) => empresas.find(e => e.id === id)?.razao_social || "-";
  const alunoNome = (id: string) => alunos.find(a => a.id === id)?.nome || "-";
  const contratosDaEmpresa = contratos.filter(c => c.empresa_id === form.empresa_id);
  const candidatosDe = (pid: string) => candidatos.filter(c => c.processo_id === pid);

  const onSelectContrato = (id: string) => {
    const c = contratos.find(x => x.id === id);
    const qtd = Number(form.qtd_vagas || 1);
    setForm({ ...form, contrato_id: id, valor_total: (c?.valor_mensal_por_estagiario || 0) * qtd });
  };

  const save = async () => {
    if (!form.empresa_id) { toast({ title: "Empresa obrigatória", variant: "destructive" }); return; }
    const payload: any = {
      empresa_id: form.empresa_id,
      contrato_id: form.contrato_id || null,
      qtd_vagas: Number(form.qtd_vagas || 1),
      valor_total: Number(form.valor_total || 0),
      coluna: form.coluna || "solicitacao",
      observacoes: form.observacoes || null,
      data_solicitacao: form.data_solicitacao,
      data_pagamento: form.data_pagamento || null,
    };
    const res = form.id
      ? await supabase.from("tb_edu_processos").update(payload).eq("id", form.id)
      : await supabase.from("tb_edu_processos").insert(payload);
    if (res.error) { toast({ title: "Erro", description: res.error.message, variant: "destructive" }); return; }
    toast({ title: "Processo salvo" });
    setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este processo?")) return;
    const { error } = await supabase.from("tb_edu_processos").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const moverPara = async (id: string, coluna: string) => {
    const proc = processos.find(p => p.id === id);
    if (!proc) return;
    const updates: any = { coluna };
    if (coluna === "pago_selecionar" && !proc.data_pagamento) updates.data_pagamento = new Date().toISOString().slice(0, 10);

    // Ao mover para "contratado": cria estágios para cada candidato vinculado
    if (coluna === "contratado") {
      const cands = candidatos.filter(c => c.processo_id === id);
      if (cands.length === 0) {
        toast({ title: "Vincule ao menos um candidato antes de contratar", variant: "destructive" });
        return;
      }
      if (!proc.contrato_id) {
        toast({ title: "Selecione um contrato no processo antes de contratar", variant: "destructive" });
        return;
      }
      const contrato = contratos.find(c => c.id === proc.contrato_id);
      const valor = contrato?.valor_mensal_por_estagiario || 0;
      const hoje = new Date().toISOString().slice(0, 10);
      const rows = cands.map(c => ({
        aluno_id: c.aluno_id,
        empresa_id: proc.empresa_id,
        contrato_id: proc.contrato_id!,
        data_inicio: hoje,
        valor_mensal: valor,
        status: "ativo",
      }));
      const ins = await supabase.from("tb_edu_estagios").insert(rows);
      if (ins.error) { toast({ title: "Erro ao criar estágios", description: ins.error.message, variant: "destructive" }); return; }
    }

    const { error } = await supabase.from("tb_edu_processos").update(updates).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const addCandidato = async (processo_id: string, aluno_id: string) => {
    if (!aluno_id) return;
    if (candidatos.some(c => c.processo_id === processo_id && c.aluno_id === aluno_id)) {
      toast({ title: "Aluno já vinculado" }); return;
    }
    const { error } = await supabase.from("tb_edu_processos_candidatos").insert({ processo_id, aluno_id });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const removeCandidato = async (id: string) => {
    await supabase.from("tb_edu_processos_candidatos").delete().eq("id", id);
    load();
  };

  const onDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData("text/plain", id); };
  const onDrop = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moverPara(id, coluna);
  };

  const proc = processos.find(p => p.id === detalheId);

  // Carrega valores editáveis sempre que abrir/trocar processo
  useEffect(() => {
    if (proc) setEdit({
      empresa_id: proc.empresa_id,
      contrato_id: proc.contrato_id,
      qtd_vagas: proc.qtd_vagas,
      valor_total: Number(proc.valor_total),
      observacoes: proc.observacoes,
      data_solicitacao: proc.data_solicitacao,
      data_pagamento: proc.data_pagamento,
    });
  }, [detalheId]); // eslint-disable-line react-hooks/exhaustive-deps

  const editContratosEmpresa = contratos.filter(c => c.empresa_id === edit.empresa_id);

  const salvarEdicao = async () => {
    if (!detalheId) return;
    setSaving(true);
    const { error } = await supabase.from("tb_edu_processos").update({
      empresa_id: edit.empresa_id,
      contrato_id: edit.contrato_id || null,
      qtd_vagas: Number(edit.qtd_vagas || 1),
      valor_total: Number(edit.valor_total || 0),
      observacoes: edit.observacoes || null,
      data_solicitacao: edit.data_solicitacao,
      data_pagamento: edit.data_pagamento || null,
    }).eq("id", detalheId);
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Alterações salvas" });
    load();
  };

  return (
    <EducacaoAdminLayout>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Processos de estágio</h1>
            <p className="text-slate-400">Kanban de solicitações de empresas</p>
          </div>
          <Button onClick={() => { setForm(empty); setOpen(true); }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Nova solicitação
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUNAS.map(col => {
              const items = processos.filter(p => p.coluna === col.id);
              const total = items.reduce((s, p) => s + Number(p.valor_total || 0), 0);
              return (
                <div key={col.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, col.id)}
                  className={`w-80 flex-shrink-0 bg-slate-900 border-t-4 ${col.color} rounded-lg p-3`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{fmt(total)}</p>
                  <div className="space-y-2 min-h-[200px]">
                    {items.map(p => {
                      const cs = candidatosDe(p.id);
                      return (
                        <Card key={p.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, p.id)}
                          onClick={() => setDetalheId(p.id)}
                          className="bg-slate-800 border-slate-700 p-3 cursor-pointer hover:border-[#D4AF37] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-white text-sm leading-tight">{empresaNome(p.empresa_id)}</p>
                            <button onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{p.qtd_vagas} vaga{p.qtd_vagas > 1 ? "s" : ""}</span>
                            <span className="text-[#D4AF37] font-semibold">{fmt(Number(p.valor_total))}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                            <Users className="w-3 h-3" /> {cs.length}/{p.qtd_vagas} candidatos
                          </div>
                        </Card>
                      );
                    })}
                    {items.length === 0 && <p className="text-xs text-slate-600 text-center py-6">Arraste cards aqui</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dialog novo/editar */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{form.id ? "Editar solicitação" : "Nova solicitação"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Empresa *</Label>
                <Select value={form.empresa_id} onValueChange={(v) => setForm({ ...form, empresa_id: v, contrato_id: undefined })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contrato</Label>
                <Select value={form.contrato_id || ""} onValueChange={onSelectContrato} disabled={!form.empresa_id}>
                  <SelectTrigger><SelectValue placeholder={form.empresa_id ? "Selecione" : "Escolha empresa"} /></SelectTrigger>
                  <SelectContent>{contratosDaEmpresa.map(c => <SelectItem key={c.id} value={c.id}>{c.numero || c.id.slice(0,8)} — {fmt(Number(c.valor_mensal_por_estagiario))}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qtd. vagas</Label>
                <Input type="number" min={1} value={form.qtd_vagas ?? 1} onChange={(e) => {
                  const qtd = Number(e.target.value);
                  const c = contratos.find(x => x.id === form.contrato_id);
                  setForm({ ...form, qtd_vagas: qtd, valor_total: c ? c.valor_mensal_por_estagiario * qtd : form.valor_total });
                }} />
              </div>
              <div>
                <Label>Valor total (R$)</Label>
                <Input type="number" step="0.01" value={form.valor_total ?? 0} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Coluna</Label>
                <Select value={form.coluna} onValueChange={(v) => setForm({ ...form, coluna: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COLUNAS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data solicitação</Label><Input type="date" value={form.data_solicitacao || ""} onChange={(e) => setForm({ ...form, data_solicitacao: e.target.value })} /></div>
              <div><Label>Data pagamento</Label><Input type="date" value={form.data_pagamento || ""} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value || null })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Painel lateral de detalhe / edição inline */}
        <Sheet open={!!detalheId} onOpenChange={(o) => !o && setDetalheId(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
            {proc && (
              <>
                <SheetHeader>
                  <SheetTitle>{empresaNome(proc.empresa_id)}</SheetTitle>
                  <SheetDescription>
                    <Badge variant="secondary">{COLUNAS.find(c => c.id === proc.coluna)?.label}</Badge>
                    <span className="ml-2 text-xs">Solicitado em {proc.data_solicitacao}</span>
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label>Empresa</Label>
                    <Select value={edit.empresa_id} onValueChange={(v) => setEdit({ ...edit, empresa_id: v, contrato_id: null })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Contrato</Label>
                    <Select
                      value={edit.contrato_id || ""}
                      onValueChange={(v) => {
                        const c = contratos.find(x => x.id === v);
                        const qtd = Number(edit.qtd_vagas || 1);
                        setEdit({ ...edit, contrato_id: v, valor_total: c ? c.valor_mensal_por_estagiario * qtd : edit.valor_total });
                      }}
                      disabled={!edit.empresa_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione contrato" /></SelectTrigger>
                      <SelectContent>{editContratosEmpresa.map(c => <SelectItem key={c.id} value={c.id}>{c.numero || c.id.slice(0,8)} — {fmt(Number(c.valor_mensal_por_estagiario))}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Qtd. vagas</Label>
                      <Input type="number" min={1} value={edit.qtd_vagas ?? 1} onChange={(e) => {
                        const qtd = Number(e.target.value);
                        const c = contratos.find(x => x.id === edit.contrato_id);
                        setEdit({ ...edit, qtd_vagas: qtd, valor_total: c ? c.valor_mensal_por_estagiario * qtd : edit.valor_total });
                      }} />
                    </div>
                    <div>
                      <Label>Valor total (R$)</Label>
                      <Input type="number" step="0.01" value={edit.valor_total ?? 0} onChange={(e) => setEdit({ ...edit, valor_total: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data solicitação</Label><Input type="date" value={edit.data_solicitacao || ""} onChange={(e) => setEdit({ ...edit, data_solicitacao: e.target.value })} /></div>
                    <div><Label>Data pagamento</Label><Input type="date" value={edit.data_pagamento || ""} onChange={(e) => setEdit({ ...edit, data_pagamento: e.target.value || null })} /></div>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea rows={4} value={edit.observacoes || ""} onChange={(e) => setEdit({ ...edit, observacoes: e.target.value })} />
                  </div>

                  <Button onClick={salvarEdicao} disabled={saving}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar alterações
                  </Button>

                  <Separator />

                  <div>
                    <Label>Candidatos vinculados ({candidatosDe(proc.id).length}/{proc.qtd_vagas})</Label>
                    <div className="space-y-2 my-2">
                      {candidatosDe(proc.id).map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm">{alunoNome(c.aluno_id)}</span>
                          <button onClick={() => removeCandidato(c.id)}><X className="w-4 h-4 text-red-500" /></button>
                        </div>
                      ))}
                      {candidatosDe(proc.id).length === 0 && <p className="text-xs text-muted-foreground">Nenhum aluno vinculado ainda</p>}
                    </div>
                    <Select value="" onValueChange={(v) => addCandidato(proc.id, v)}>
                      <SelectTrigger><SelectValue placeholder="+ Adicionar candidato" /></SelectTrigger>
                      <SelectContent className="max-h-64">{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label>Mover para</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COLUNAS.filter(c => c.id !== proc.coluna).map(c => (
                        <Button key={c.id} size="sm" variant="outline" onClick={() => { moverPara(proc.id, c.id); setDetalheId(null); }}>{c.label}</Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <Button variant="destructive" className="w-full" onClick={() => { remove(proc.id); setDetalheId(null); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir processo
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </EducacaoAdminLayout>
  );
};

export default EducacaoProcessos;