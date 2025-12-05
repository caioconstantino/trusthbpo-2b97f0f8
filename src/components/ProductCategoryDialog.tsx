import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: number;
  nome: string;
}

interface ProductCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (category: Category) => void;
}

export const ProductCategoryDialog = ({
  open,
  onOpenChange,
  onSelectCategory,
}: ProductCategoryDialogProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const dominio = localStorage.getItem("user_dominio");
    const unidadeId = localStorage.getItem("unidade_ativa_id");
    if (!dominio) return;

    let query = supabase
      .from("tb_categorias")
      .select("id, nome")
      .eq("dominio", dominio)
      .order("nome");

    if (unidadeId) {
      query = query.eq("unidade_id", parseInt(unidadeId));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar categorias:", error);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome da categoria",
        variant: "destructive",
      });
      return;
    }

    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) {
      toast({
        title: "Erro",
        description: "Domínio não encontrado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const unidadeId = localStorage.getItem("unidade_ativa_id");
    
    const { error } = await supabase.from("tb_categorias").insert({
      nome: newCategoryName.toUpperCase(),
      dominio,
      unidade_id: unidadeId ? parseInt(unidadeId) : null,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Categoria cadastrada!",
      description: "A categoria foi adicionada com sucesso.",
    });

    setNewCategoryName("");
    fetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    const { error } = await supabase.from("tb_categorias").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Categoria excluída!",
      description: "A categoria foi removida com sucesso.",
    });

    fetchCategories();
  };

  const handleSelectCategory = (category: Category) => {
    onSelectCategory(category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Adicionar nova categoria */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Nome da Categoria
            </label>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Digite o nome da categoria"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={loading}
                className="gap-2"
              >
                Adicionar Categoria
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de categorias */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Já Cadastradas</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_80px] gap-4 bg-muted p-3 font-medium text-sm">
                <div>#</div>
                <div>Nome da Categoria</div>
                <div className="text-center">Ações</div>
              </div>

              {categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma categoria cadastrada
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-[60px_1fr_80px] gap-4 p-3 border-t items-center hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <div className="text-sm text-muted-foreground">
                      {category.id}
                    </div>
                    <div className="text-sm font-medium uppercase">
                      {category.nome}
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};