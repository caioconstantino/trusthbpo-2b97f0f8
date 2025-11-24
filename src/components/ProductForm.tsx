import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { List, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ProductForm = ({ onProductAdded }: { onProductAdded: () => void }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: "padrao",
    code: "",
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    barcode: "",
    observation: "",
    image: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.costPrice || !formData.salePrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, preço de custo e preço de venda",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Produto cadastrado!",
      description: "O produto foi adicionado com sucesso.",
    });

    // Reset form
    setFormData({
      type: "padrao",
      code: "",
      name: "",
      category: "",
      costPrice: "",
      salePrice: "",
      barcode: "",
      observation: "",
      image: null
    });

    onProductAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Novo Produto</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Tipo de Produto */}
        <div>
          <Label htmlFor="type">Tipo de Produto</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="padrao">Padrão</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="materia-prima">Matéria Prima</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Código */}
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Código do produto"
          />
        </div>

        {/* Nome do Produto */}
        <div>
          <Label htmlFor="name">Nome do produto</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do produto"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Categoria */}
        <div>
          <Label htmlFor="category">Categoria</Label>
          <div className="flex gap-2">
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Categoria"
            />
            <Button type="button" variant="outline" size="icon">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* P. Custo */}
        <div>
          <Label htmlFor="costPrice">P. Custo</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        {/* P. Venda */}
        <div>
          <Label htmlFor="salePrice">P. Venda</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Cod. Barras */}
        <div>
          <Label htmlFor="barcode">Cod. Barras</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="Código de barras"
          />
        </div>

        {/* Observação */}
        <div>
          <Label htmlFor="observation">Observação</Label>
          <Textarea
            id="observation"
            value={formData.observation}
            onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
            placeholder="Observações"
            className="resize-none"
            rows={1}
          />
        </div>

        {/* Imagem */}
        <div>
          <Label htmlFor="image">Imagem</Label>
          <div className="flex gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Cadastrar
        </Button>
      </div>
    </form>
  );
};
