import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface Empresa {
  id: string;
  razao_social: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  responsavel: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: boolean;
}

const empty: Partial<Empresa> = { razao_social: "", cnpj: "", email: "", telefone: "", responsavel: "", endereco: "", observacoes: "", ativo: true };

const EducacaoEmpresas = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Empresa>>(empty);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tb_edu_empresas").select("*").order("razao_social");
    setEmpresas((data as any) || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.razao_social?.trim()) {
      toast({ title: "Razão social obrigatória", variant: "destructive" }); return;
    }
    const payload = { ...form };
    const res = form.id
      ? await supabase.from("tb_edu_empresas").update(payload).eq("id", form.id)
      : await supabase.from("tb_edu_empresas").insert(payload as any);
    if (res.error) {
      toast({ title: "Erro ao salvar", description: res.error.message, variant: "destructive" }); return;
    }
    toast({ title: "Empresa salva" });
    setOpen(false); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta empresa? Os contratos e estágios vinculados também serão removidos.")) return;
    const { error } = await supabase.from("tb_edu_empresas").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Empresa excluída" }); load();
  };

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Empresas contratantes</h1>
            <p className="text-slate-400">{empresas.length} empresas cadastradas</p>
          </div>
          <Button onClick={() => { setForm(empty); setOpen(true); }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Nova empresa
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Razão Social</TableHead>
                  <TableHead className="text-slate-400">CNPJ</TableHead>
                  <TableHead className="text-slate-400">Responsável</TableHead>
                  <TableHead className="text-slate-400">Contato</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((e) => (
                  <TableRow key={e.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{e.razao_social}</TableCell>
                    <TableCell className="text-slate-300">{e.cnpj || "-"}</TableCell>
                    <TableCell className="text-slate-300">{e.responsavel || "-"}</TableCell>
                    <TableCell className="text-slate-300">{e.email || e.telefone || "-"}</TableCell>
                    <TableCell><Badge variant={e.ativo ? "default" : "secondary"}>{e.ativo ? "Ativa" : "Inativa"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(e); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {empresas.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Nenhuma empresa cadastrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar empresa" : "Nova empresa"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2"><Label>Razão Social *</Label><Input value={form.razao_social || ""} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
              <div><Label>CNPJ</Label><Input value={form.cnpj || ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel || ""} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco || ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={form.ativo ?? true} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label>Empresa ativa</Label></div>
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

export default EducacaoEmpresas;
