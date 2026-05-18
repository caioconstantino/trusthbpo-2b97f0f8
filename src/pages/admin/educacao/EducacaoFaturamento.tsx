import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, CheckCircle2, Trash2 } from "lucide-react";

interface Fatura {
  id: string;
  empresa_id: string;
  contrato_id: string | null;
  competencia: string;
  qtd_estagiarios: number;
  valor_total: number;
  status: string;
  data_vencimento: string | null;
  data_pagamento: string | null;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const EducacaoFaturamento = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [empresas, setEmpresas] = useState<Record<string, string>>({});
  const hoje = new Date();
  const [mes, setMes] = useState<string>(yyyymm(hoje));
  const [vencDia, setVencDia] = useState<number>(10);

  useEffect(() => { load(); }, [mes]);

  const load = async () => {
    setLoading(true);
    const [y, m] = mes.split("-").map(Number);
    const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
    const fim = new Date(y, m, 0).toISOString().slice(0, 10);

    const [fRes, eRes] = await Promise.all([
      supabase.from("tb_edu_faturas").select("*").gte("competencia", inicio).lte("competencia", fim).order("created_at", { ascending: false }),
      supabase.from("tb_edu_empresas").select("id,razao_social"),
    ]);
    setFaturas((fRes.data as any) || []);
    const map: Record<string, string> = {};
    (eRes.data || []).forEach((e: any) => { map[e.id] = e.razao_social; });
    setEmpresas(map);
    setLoading(false);
  };

  const gerarFaturas = async () => {
    setGenerating(true);
    try {
      const [y, m] = mes.split("-").map(Number);
      const competencia = `${y}-${String(m).padStart(2, "0")}-01`;
      const fimMes = new Date(y, m, 0).toISOString().slice(0, 10);
      const venc = `${y}-${String(m).padStart(2, "0")}-${String(vencDia).padStart(2, "0")}`;

      // Buscar estágios ativos no período (data_inicio <= fim do mês AND (data_fim IS NULL OR data_fim >= início do mês))
      const { data: estagios, error } = await supabase
        .from("tb_edu_estagios")
        .select("empresa_id, contrato_id, valor_mensal, data_inicio, data_fim, status")
        .lte("data_inicio", fimMes)
        .in("status", ["ativo"]);
      if (error) throw error;

      const elegiveis = (estagios || []).filter((e: any) =>
        !e.data_fim || e.data_fim >= competencia
      );

      // Agrupar por empresa
      const agrup: Record<string, { contrato_id: string | null; valor: number; qtd: number }> = {};
      elegiveis.forEach((e: any) => {
        const key = e.empresa_id;
        if (!agrup[key]) agrup[key] = { contrato_id: e.contrato_id, valor: 0, qtd: 0 };
        agrup[key].valor += Number(e.valor_mensal || 0);
        agrup[key].qtd += 1;
      });

      let criadas = 0, puladas = 0;
      for (const [empresa_id, info] of Object.entries(agrup)) {
        // Idempotência por (empresa_id, competencia)
        const { data: exist } = await supabase
          .from("tb_edu_faturas")
          .select("id")
          .eq("empresa_id", empresa_id)
          .eq("competencia", competencia)
          .maybeSingle();
        if (exist) { puladas++; continue; }
        const { error: insErr } = await supabase.from("tb_edu_faturas").insert({
          empresa_id,
          contrato_id: info.contrato_id,
          competencia,
          qtd_estagiarios: info.qtd,
          valor_total: info.valor,
          status: "aberta",
          data_vencimento: venc,
        });
        if (insErr) throw insErr;
        criadas++;
      }

      toast({ title: "Faturas geradas", description: `${criadas} novas, ${puladas} já existiam.` });
      load();
    } catch (e: any) {
      toast({ title: "Erro ao gerar", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const marcarPaga = async (id: string) => {
    const { error } = await supabase.from("tb_edu_faturas").update({
      status: "paga", data_pagamento: new Date().toISOString().slice(0, 10)
    }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Fatura marcada como paga" }); load();
  };

  const remover = async (id: string) => {
    if (!confirm("Excluir esta fatura?")) return;
    const { error } = await supabase.from("tb_edu_faturas").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const totalMes = faturas.reduce((s, f) => s + Number(f.valor_total), 0);
  const pagoMes = faturas.filter(f => f.status === "paga").reduce((s, f) => s + Number(f.valor_total), 0);

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faturamento de estágios</h1>
            <p className="text-slate-400">Total: {fmt(totalMes)} · Pago: {fmt(pagoMes)}</p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-slate-400">Competência</Label>
              <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="bg-slate-900 border-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-400">Vencimento (dia)</Label>
              <Select value={String(vencDia)} onValueChange={(v) => setVencDia(Number(v))}>
                <SelectTrigger className="w-24 bg-slate-900 border-slate-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({ length: 28 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={gerarFaturas} disabled={generating}
              className="bg-gradient-to-r from-[#D4AF37] to-[#E0C158] text-slate-900 hover:opacity-90">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Gerar faturas do mês
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
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Competência</TableHead>
                  <TableHead className="text-slate-400">Estagiários</TableHead>
                  <TableHead className="text-slate-400">Valor</TableHead>
                  <TableHead className="text-slate-400">Vencimento</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((f) => (
                  <TableRow key={f.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{empresas[f.empresa_id] || "-"}</TableCell>
                    <TableCell className="text-slate-300">{f.competencia}</TableCell>
                    <TableCell className="text-slate-300">{f.qtd_estagiarios}</TableCell>
                    <TableCell className="text-slate-300">{fmt(Number(f.valor_total))}</TableCell>
                    <TableCell className="text-slate-300">{f.data_vencimento || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "paga" ? "default" : f.status === "vencida" ? "destructive" : "secondary"}>{f.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {f.status !== "paga" && (
                        <Button size="sm" variant="ghost" onClick={() => marcarPaga(f.id)} title="Marcar como paga">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remover(f.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {faturas.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">Nenhuma fatura nesta competência. Clique em "Gerar faturas do mês".</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </EducacaoAdminLayout>
  );
};

export default EducacaoFaturamento;
