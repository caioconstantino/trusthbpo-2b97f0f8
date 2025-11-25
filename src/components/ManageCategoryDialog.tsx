import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
}

interface ManageCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory?: Category | null;
}

const mockCategories: Category[] = [
  { id: 1, name: "MERCADORIA PARA REVENDA" },
  { id: 2, name: "SALARIO COLABORADORES" },
  { id: 3, name: "ADIANTAMENTO SALARIAL" },
  { id: 4, name: "SALARIO" },
  { id: 5, name: "PREVISAO 1/3 FERIAS 1/2 DECIMO TERCEIRO" },
  { id: 6, name: "HORAS EXTRAS" },
  { id: 7, name: "ALUGUEL" },
];

export const ManageCategoryDialog = ({
  open,
  onOpenChange,
  editingCategory,
}: ManageCategoryDialogProps) => {
  const { toast } = useToast();
  const [type, setType] = useState("Categoria");
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
    } else {
      setName("");
    }
  }, [editingCategory, open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o nome da categoria",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: editingCategory ? "Categoria atualizada!" : "Categoria cadastrada!",
      description: editingCategory 
        ? "A categoria foi atualizada com sucesso."
        : "A categoria foi adicionada com sucesso.",
    });

    setName("");
    onOpenChange(false);
  };

  const handleDelete = (id: number) => {
    toast({
      title: "Categoria excluída!",
      description: "A categoria foi removida com sucesso.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Cadastrar Categoria"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Categoria">Categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da categoria"
              className="mt-1"
            />
          </div>

          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-3">Categorias Existentes</h3>
            <div className="space-y-2">
              {mockCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md"
                >
                  <span className="text-sm text-muted-foreground uppercase">{category.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                      onClick={() => setName(category.name)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
