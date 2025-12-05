import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Gift, ExternalLink, Upload, X, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OfertaProduto {
  id: string;
  nome: string;
  descricao: string | null;
  funcionalidades: string[];
  desconto_percentual: number;
  link: string | null;
  imagem_url: string | null;
  ativo: boolean;
  ordem: number;
}

export default function AdminOfertas() {
  const [ofertas, setOfertas] = useState<OfertaProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOferta, setEditingOferta] = useState<OfertaProduto | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [funcionalidades, setFuncionalidades] = useState<string[]>([]);
  const [novaFuncionalidade, setNovaFuncionalidade] = useState("");
  const [descontoPercentual, setDescontoPercentual] = useState("");
  const [link, setLink] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    fetchOfertas();
  }, []);

  const fetchOfertas = async () => {
    try {
      const { data, error } = await supabase
        .from("tb_ofertas_produtos")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setOfertas(data || []);
    } catch (error) {
      console.error("Erro ao carregar ofertas:", error);
      toast.error("Erro ao carregar ofertas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setFuncionalidades([]);
    setNovaFuncionalidade("");
    setDescontoPercentual("");
    setLink("");
    setImagemUrl("");
    setAtivo(true);
    setEditingOferta(null);
  };

  const openEditDialog = (oferta: OfertaProduto) => {
    setEditingOferta(oferta);
    setNome(oferta.nome);
    setDescricao(oferta.descricao || "");
    setFuncionalidades(oferta.funcionalidades || []);
    setDescontoPercentual(oferta.desconto_percentual.toString());
    setLink(oferta.link || "");
    setImagemUrl(oferta.imagem_url || "");
    setAtivo(oferta.ativo);
    setDialogOpen(true);
  };

  const handleAddFuncionalidade = () => {
    if (novaFuncionalidade.trim()) {
      setFuncionalidades([...funcionalidades, novaFuncionalidade.trim()]);
      setNovaFuncionalidade("");
    }
  };

  const handleRemoveFuncionalidade = (index: number) => {
    setFuncionalidades(funcionalidades.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ofertas")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("ofertas")
        .getPublicUrl(fileName);

      setImagemUrl(publicUrl.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const ofertaData = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        funcionalidades,
        desconto_percentual: parseFloat(descontoPercentual) || 0,
        link: link.trim() || null,
        imagem_url: imagemUrl || null,
        ativo,
        ordem: editingOferta?.ordem || ofertas.length,
      };

      if (editingOferta) {
        const { error } = await supabase
          .from("tb_ofertas_produtos")
          .update(ofertaData)
          .eq("id", editingOferta.id);

        if (error) throw error;
        toast.success("Oferta atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("tb_ofertas_produtos")
          .insert(ofertaData);

        if (error) throw error;
        toast.success("Oferta criada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchOfertas();
    } catch (error) {
      console.error("Erro ao salvar oferta:", error);
      toast.error("Erro ao salvar oferta");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta oferta?")) return;

    try {
      const { error } = await supabase
        .from("tb_ofertas_produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Oferta excluída com sucesso!");
      fetchOfertas();
    } catch (error) {
      console.error("Erro ao excluir oferta:", error);
      toast.error("Erro ao excluir oferta");
    }
  };

  const toggleAtivo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("tb_ofertas_produtos")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Oferta desativada" : "Oferta ativada");
      fetchOfertas();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold">Ofertas Especiais</h1>
              <p className="text-muted-foreground">Gerencie os produtos da esteira de ofertas</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Oferta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOferta ? "Editar Oferta" : "Nova Oferta"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição do produto"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Funcionalidades</Label>
                  <div className="flex gap-2">
                    <Input
                      value={novaFuncionalidade}
                      onChange={(e) => setNovaFuncionalidade(e.target.value)}
                      placeholder="Adicionar funcionalidade"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFuncionalidade())}
                    />
                    <Button type="button" onClick={handleAddFuncionalidade} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {funcionalidades.map((func, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {func}
                        <button
                          onClick={() => handleRemoveFuncionalidade(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (%)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={descontoPercentual}
                    onChange={(e) => setDescontoPercentual(e.target.value)}
                    placeholder="Ex: 20"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagem</Label>
                  <div className="flex items-center gap-4">
                    {imagemUrl && (
                      <img
                        src={imagemUrl}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      {uploading && <p className="text-sm text-muted-foreground mt-1">Enviando...</p>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="ativo"
                    checked={ativo}
                    onCheckedChange={setAtivo}
                  />
                  <Label htmlFor="ativo">Oferta ativa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingOferta ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : ofertas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma oferta cadastrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Funcionalidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ofertas.map((oferta) => (
                    <TableRow key={oferta.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        {oferta.imagem_url ? (
                          <img
                            src={oferta.imagem_url}
                            alt={oferta.nome}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Gift className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{oferta.nome}</p>
                          {oferta.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {oferta.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {oferta.desconto_percentual > 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {oferta.desconto_percentual}% OFF
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(oferta.funcionalidades || []).slice(0, 2).map((func, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {func}
                            </Badge>
                          ))}
                          {(oferta.funcionalidades || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(oferta.funcionalidades || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={oferta.ativo}
                          onCheckedChange={() => toggleAtivo(oferta.id, oferta.ativo)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {oferta.link && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(oferta.link!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(oferta)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(oferta.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
