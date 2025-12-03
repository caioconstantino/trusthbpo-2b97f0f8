import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: number;
  nome: string | null;
  parent_id: number | null;
}

interface ManageContasPagarCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (category: string) => void;
}

export const ManageContasPagarCategoryDialog = ({
  open,
  onOpenChange,
  onSelectCategory,
}: ManageContasPagarCategoryDialogProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<"categoria" | "subcategoria">("categoria");
  const [nome, setNome] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const dominio = localStorage.getItem("user_domain") || "";

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tb_categorias_contas_pagar")
      .select("*")
      .eq("dominio", dominio)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar categorias");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setNome("");
    setTipo("categoria");
    setParentId("");
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("tb_categorias_contas_pagar")
        .update({
          nome: nome.toUpperCase(),
          parent_id: tipo === "subcategoria" ? parseInt(parentId) : null,
        })
        .eq("id", editingId);

      if (error) {
        toast.error("Erro ao atualizar categoria");
      } else {
        toast.success("Categoria atualizada");
        fetchCategories();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("tb_categorias_contas_pagar").insert({
        nome: nome.toUpperCase(),
        dominio,
        parent_id: tipo === "subcategoria" ? parseInt(parentId) : null,
      });

      if (error) {
        toast.error("Erro ao criar categoria");
      } else {
        toast.success("Categoria criada");
        fetchCategories();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setNome(category.nome || "");
    setTipo(category.parent_id ? "subcategoria" : "categoria");
    setParentId(category.parent_id?.toString() || "");
  };

  const handleDelete = async (id: number) => {
    const hasChildren = categories.some((c) => c.parent_id === id);
    if (hasChildren) {
      toast.error("Remova as subcategorias primeiro");
      return;
    }

    const { error } = await supabase
      .from("tb_categorias_contas_pagar")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir categoria");
    } else {
      toast.success("Categoria excluída");
      fetchCategories();
    }
  };

  const handleSelectCategory = (category: Category) => {
    onSelectCategory(category.nome || "");
    onOpenChange(false);
  };

  const parentCategories = categories.filter((c) => !c.parent_id);

  const getCategoryWithSubs = () => {
    const parents = categories.filter((c) => !c.parent_id);
    return parents.map((parent) => ({
      ...parent,
      subcategories: categories.filter((c) => c.parent_id === parent.id),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Categoria</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as "categoria" | "subcategoria")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categoria">Categoria</SelectItem>
                <SelectItem value="subcategoria">Subcategoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === "subcategoria" && (
            <div>
              <Label className="text-xs">Categoria Pai</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da categoria"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label className="text-sm font-medium">Categorias Existentes</Label>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 mt-3">
              {getCategoryWithSubs().map((category) => (
                <div key={category.id}>
                  <div
                    className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <span className="text-sm font-medium uppercase">{category.nome}</span>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-slate-600 hover:bg-slate-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {category.subcategories.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {category.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 border border-border/50 rounded-md hover:bg-muted/50 cursor-pointer bg-muted/20"
                          onClick={() => handleSelectCategory(sub)}
                        >
                          <span className="text-sm text-muted-foreground uppercase">{sub.nome}</span>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7 bg-slate-600 hover:bg-slate-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(sub);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(sub.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {categories.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhuma categoria cadastrada
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
