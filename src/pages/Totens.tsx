import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Copy, ExternalLink, Trash2, Pencil, Monitor } from "lucide-react";
import { toast } from "sonner";
import { getUnidadeAtivaId } from "@/hooks/useUnidadeAtiva";

type Totem = {
  id: string; nome: string; slug: string; ativo: boolean;
  pix_ativo: boolean; cartao_confianca: boolean;
  cor_primaria: string | null; logo_url: string | null;
  unidade_id: number | null;
};

export default function Totens() {
  const [list, setList] = useState<Totem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Totem | null>(null);
  const [form, setForm] = useState<Partial<Totem>>({
    nome: "Totem 1", ativo: true, pix_ativo: true, cartao_confianca: true, cor_primaria: "#2563eb",
  });
  const dominio = localStorage.getItem("user_dominio") || "";

  const load = async () => {
    const { data } = await supabase.from("tb_totens").select("*").eq("dominio", dominio).order("created_at");
    setList((data as Totem[]) || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "Totem", ativo: true, pix_ativo: true, cartao_confianca: true, cor_primaria: "#2563eb" });
    setOpen(true);
  };
  const openEdit = (t: Totem) => { setEditing(t); setForm(t); setOpen(true); };

  const save = async () => {
    if (!form.nome) { toast.error("Informe o nome"); return; }
    const unidadeId = getUnidadeAtivaId();
    if (editing) {
      const { error } = await supabase.from("tb_totens").update({
        nome: form.nome, ativo: form.ativo, pix_ativo: form.pix_ativo,
        cartao_confianca: form.cartao_confianca, cor_primaria: form.cor_primaria,
        logo_url: form.logo_url,
      }).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const slug = `${dominio}-${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase.from("tb_totens").insert({
        dominio, unidade_id: unidadeId,
        nome: form.nome, slug, ativo: true,
        pix_ativo: form.pix_ativo ?? true,
        cartao_confianca: form.cartao_confianca ?? true,
        cor_primaria: form.cor_primaria || "#2563eb",
        logo_url: form.logo_url || null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir totem?")) return;
    const { error } = await supabase.from("tb_totens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const linkOf = (t: Totem) => `${window.location.origin}/totem/${t.slug}`;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Monitor className="w-7 h-7" /> Totens (PDV Autoatendimento)</h1>
            <p className="text-muted-foreground">Configure e gere o link público de cada totem da unidade.</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Novo totem</Button>
        </div>

        <div className="grid gap-4">
          {list.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">Nenhum totem configurado.</Card>
          )}
          {list.map((t) => (
            <Card key={t.id} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.cor_primaria || "#2563eb" }}>
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  {t.nome}
                  {!t.ativo && <Badge variant="secondary">Inativo</Badge>}
                  {t.pix_ativo && <Badge variant="outline">PIX</Badge>}
                  {t.cartao_confianca && <Badge variant="outline">Cartão</Badge>}
                </div>
                <code className="text-xs text-muted-foreground">{linkOf(t)}</code>
              </div>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(linkOf(t)); toast.success("Link copiado"); }}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(linkOf(t), "_blank")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(t.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar totem" : "Novo totem"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Cor primária</Label><Input type="color" value={form.cor_primaria || "#2563eb"} onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })} className="h-12 w-24" /></div>
              <div><Label>Logo URL (opcional)</Label><Input value={form.logo_url || ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
              <div className="flex items-center justify-between"><Label>Aceitar PIX</Label><Switch checked={!!form.pix_ativo} onCheckedChange={(v) => setForm({ ...form, pix_ativo: v })} /></div>
              <div className="flex items-center justify-between"><Label>Cartão na maquininha (modo confiança)</Label><Switch checked={!!form.cartao_confianca} onCheckedChange={(v) => setForm({ ...form, cartao_confianca: v })} /></div>
              {editing && (
                <div className="flex items-center justify-between"><Label>Totem ativo</Label><Switch checked={!!form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}