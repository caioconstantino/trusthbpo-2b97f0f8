import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Building2, Briefcase, DollarSign, Receipt, Loader2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EducacaoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    alunos: 0,
    empresas: 0,
    estagiosAtivos: 0,
    mrr: 0,
    faturadoMes: 0,
    abertoMes: 0,
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);

      const [alunosRes, empresasRes, estagiosRes, faturasRes] = await Promise.all([
        supabase.from("tb_alunos").select("id", { count: "exact", head: true }),
        supabase.from("tb_edu_empresas").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("tb_edu_estagios").select("valor_mensal").eq("status", "ativo"),
        supabase.from("tb_edu_faturas").select("valor_total, status").gte("competencia", inicioMes).lte("competencia", fimMes),
      ]);

      const estagiosAtivos = estagiosRes.data?.length || 0;
      const mrr = (estagiosRes.data || []).reduce((s, e: any) => s + Number(e.valor_mensal || 0), 0);
      const faturas = faturasRes.data || [];
      const faturadoMes = faturas.filter((f: any) => f.status === "paga").reduce((s, f: any) => s + Number(f.valor_total || 0), 0);
      const abertoMes = faturas.filter((f: any) => f.status !== "paga").reduce((s, f: any) => s + Number(f.valor_total || 0), 0);

      setStats({
        alunos: alunosRes.count || 0,
        empresas: empresasRes.count || 0,
        estagiosAtivos,
        mrr,
        faturadoMes,
        abertoMes,
      });
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Alunos cadastrados", value: stats.alunos, icon: GraduationCap },
    { label: "Empresas ativas", value: stats.empresas, icon: Building2 },
    { label: "Estágios ativos", value: stats.estagiosAtivos, icon: Briefcase },
    { label: "MRR de estágios", value: fmt(stats.mrr), icon: DollarSign },
    { label: "Faturado no mês", value: fmt(stats.faturadoMes), icon: Receipt },
    { label: "Em aberto no mês", value: fmt(stats.abertoMes), icon: Receipt },
  ];

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Visão geral</h1>
        <p className="text-slate-400 mb-6">Operação educacional e estágios</p>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className="bg-slate-900 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm text-slate-400 font-medium">{c.label}</CardTitle>
                    <Icon className="w-5 h-5 text-[#D4AF37]" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{c.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </EducacaoAdminLayout>
  );
};

export default EducacaoDashboard;
