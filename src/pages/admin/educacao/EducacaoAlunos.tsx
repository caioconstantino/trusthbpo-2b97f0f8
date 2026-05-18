import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EducacaoAdminLayout } from "@/components/EducacaoAdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  escola_id: number;
  created_at: string;
}

const EducacaoAlunos = () => {
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [escolas, setEscolas] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [aRes, eRes] = await Promise.all([
      supabase.from("tb_alunos").select("id,nome,email,telefone,ativo,escola_id,created_at").order("created_at", { ascending: false }),
      supabase.from("tb_escolas").select("id,nome"),
    ]);
    setAlunos((aRes.data as any) || []);
    const map: Record<number, string> = {};
    (eRes.data || []).forEach((e: any) => { map[e.id] = e.nome; });
    setEscolas(map);
    setLoading(false);
  };

  const filtered = alunos.filter(a =>
    a.nome?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <EducacaoAdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Alunos cadastrados</h1>
        <p className="text-slate-400 mb-6">{alunos.length} alunos no total</p>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white" />
        </div>

        <Card className="bg-slate-900 border-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Nome</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Telefone</TableHead>
                  <TableHead className="text-slate-400">Escola</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{a.nome}</TableCell>
                    <TableCell className="text-slate-300">{a.email}</TableCell>
                    <TableCell className="text-slate-300">{a.telefone || "-"}</TableCell>
                    <TableCell className="text-slate-300">{escolas[a.escola_id] || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">Nenhum aluno encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </EducacaoAdminLayout>
  );
};

export default EducacaoAlunos;
