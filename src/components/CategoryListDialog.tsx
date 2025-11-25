import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface Category {
  id: number;
  name: string;
}

interface CategoryListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (category: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: number) => void;
}

const mockCategories: Category[] = [
  { id: 1, name: "MERCADORIA PARA REVENDA" },
  { id: 2, name: "SALARIO COLABORADORES" },
  { id: 3, name: "ADIANTAMENTO SALARIAL" },
  { id: 4, name: "SALARIO" },
  { id: 5, name: "PREVISAO 1/3 FERIAS 1/2 DECIMO TERCEIRO" },
  { id: 6, name: "HORAS EXTRAS" },
  { id: 7, name: "ALUGUEL" },
  { id: 8, name: "IPTU" },
  { id: 9, name: "AGUA, LUZ E INTERNET" },
  { id: 10, name: "AGUA" },
  { id: 11, name: "LUZ" },
  { id: 12, name: "INTERNET" },
];

export const CategoryListDialog = ({
  open,
  onOpenChange,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryListDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecione a categoria</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {mockCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                onSelectCategory(category.name);
                onOpenChange(false);
              }}
            >
              <span className="text-sm text-muted-foreground uppercase">{category.name}</span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-slate-700 hover:bg-slate-800 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(category);
                    onOpenChange(false);
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
                    onDeleteCategory(category.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
