import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { List, Plus, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductCategoryDialog } from "./ProductCategoryDialog";

interface Category {
  id: number;
  nome: string;
}

export const ProductForm = ({ onProductAdded, disabled = false }: { onProductAdded: () => void; disabled?: boolean }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "padrao",
    code: "",
    name: "",
    categoryId: null as number | null,
    categoryName: "",
    costPrice: "",
    salePrice: "",
    barcode: "",
    observation: "",
    image: null as File | null
  });

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

    if (!error && data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryInputChange = (value: string) => {
    setFormData({ ...formData, categoryName: value, categoryId: null });
    
    if (value.trim()) {
      const filtered = categories.filter(cat =>
        cat.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowCategorySuggestions(true);
    } else {
      setFilteredCategories([]);
      setShowCategorySuggestions(false);
    }
  };

  const handleSelectCategoryFromSuggestion = (category: Category) => {
    setFormData({
      ...formData,
      categoryId: category.id,
      categoryName: category.nome
    });
    setShowCategorySuggestions(false);
  };

  const handleSelectCategoryFromDialog = (category: Category) => {
    setFormData({
      ...formData,
      categoryId: category.id,
      categoryName: category.nome
    });
    fetchCategories();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const dominio = localStorage.getItem("user_dominio");
    const fileExt = file.name.split('.').pop();
    const fileName = `${dominio}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("produtos")
      .upload(fileName, file);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      return null;
    }

    const { data } = supabase.storage.from("produtos").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de produtos do seu plano. Contrate mais produtos para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.name || !formData.costPrice || !formData.salePrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, preço de custo e preço de venda",
        variant: "destructive"
      });
      return;
    }

    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) {
      toast({
        title: "Erro",
        description: "Domínio não encontrado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    let imagemUrl: string | null = null;
    if (formData.image) {
      imagemUrl = await uploadImage(formData.image);
    }

    const unidadeId = localStorage.getItem("unidade_ativa_id");

    const { error } = await supabase.from("tb_produtos").insert({
      dominio,
      unidade_id: unidadeId ? parseInt(unidadeId) : null,
      codigo: formData.code || null,
      nome: formData.name,
      tipo: formData.type,
      categoria_id: formData.categoryId,
      preco_custo: parseFloat(formData.costPrice),
      preco_venda: parseFloat(formData.salePrice),
      codigo_barras: formData.barcode || null,
      observacao: formData.observation || null,
      imagem_url: imagemUrl
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
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
      categoryId: null,
      categoryName: "",
      costPrice: "",
      salePrice: "",
      barcode: "",
      observation: "",
      image: null
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onProductAdded();
  };

  return (
    <>
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
          <div className="relative">
            <Label htmlFor="category">Categoria</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="category"
                  value={formData.categoryName}
                  onChange={(e) => handleCategoryInputChange(e.target.value)}
                  onFocus={() => {
                    if (formData.categoryName.trim()) {
                      setShowCategorySuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowCategorySuggestions(false), 200);
                  }}
                  placeholder="Digite a categoria"
                />
                {/* Autocomplete dropdown */}
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onMouseDown={() => handleSelectCategoryFromSuggestion(cat)}
                      >
                        {cat.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowCategoryDialog(true)}
              >
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
            <div className="flex gap-2 items-center">
              <Input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm flex-1"
              />
              {imagePreview && (
                <div className="w-10 h-10 rounded border border-border overflow-hidden flex-shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="gap-2" disabled={loading || disabled}>
            <Plus className="w-4 h-4" />
            {disabled ? "Limite atingido" : loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </div>
      </form>

      <ProductCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSelectCategory={handleSelectCategoryFromDialog}
      />
    </>
  );
};