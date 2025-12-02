import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { List, Save, Pencil, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductCategoryDialog } from "./ProductCategoryDialog";
import { StockManagementDialog } from "./StockManagementDialog";
import { StockTransferDialog } from "./StockTransferDialog";

interface Product {
  id: number;
  codigo: string | null;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  imagem_url: string | null;
  categoria_id: number | null;
  tipo: string | null;
  codigo_barras: string | null;
  observacao: string | null;
}

interface Category {
  id: number;
  nome: string;
}

interface EditProductSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export const EditProductSheet = ({
  product,
  open,
  onOpenChange,
  onProductUpdated,
}: EditProductSheetProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState(0);

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
    if (!dominio) return;

    const { data, error } = await supabase
      .from("tb_categorias")
      .select("id, nome")
      .eq("dominio", dominio)
      .order("nome");

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchStock = async (productId: number) => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    const { data } = await supabase
      .from("tb_estq_unidades")
      .select("quantidade")
      .eq("produto_id", productId)
      .eq("dominio", dominio)
      .maybeSingle();

    if (data) {
      setCurrentStock(data.quantidade);
    } else {
      setCurrentStock(0);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product && open) {
      setFormData({
        type: product.tipo || "padrao",
        code: product.codigo || "",
        name: product.nome,
        categoryId: product.categoria_id,
        categoryName: "",
        costPrice: product.preco_custo.toString(),
        salePrice: product.preco_venda.toString(),
        barcode: product.codigo_barras || "",
        observation: product.observacao || "",
        image: null
      });
      setImagePreview(product.imagem_url);
      fetchStock(product.id);

      // Buscar nome da categoria
      if (product.categoria_id) {
        const cat = categories.find(c => c.id === product.categoria_id);
        if (cat) {
          setFormData(prev => ({ ...prev, categoryName: cat.nome }));
        }
      }
    }
  }, [product, open, categories]);

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
    
    if (!product) return;

    if (!formData.name || !formData.costPrice || !formData.salePrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, preço de custo e preço de venda",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    let imagemUrl = product.imagem_url;
    if (formData.image) {
      imagemUrl = await uploadImage(formData.image);
    }

    const { error } = await supabase
      .from("tb_produtos")
      .update({
        codigo: formData.code || null,
        nome: formData.name,
        tipo: formData.type,
        categoria_id: formData.categoryId,
        preco_custo: parseFloat(formData.costPrice),
        preco_venda: parseFloat(formData.salePrice),
        codigo_barras: formData.barcode || null,
        observacao: formData.observation || null,
        imagem_url: imagemUrl
      })
      .eq("id", product.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Produto atualizado!",
      description: "O produto foi atualizado com sucesso.",
    });

    onProductUpdated();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Produto</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Tipo de Produto */}
            <div>
              <Label htmlFor="edit-type">Tipo de Produto</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="edit-type">
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
              <Label htmlFor="edit-code">Código</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Código do produto"
              />
            </div>

            {/* Nome do Produto */}
            <div>
              <Label htmlFor="edit-name">Nome do produto</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
                required
              />
            </div>

            {/* Categoria */}
            <div className="relative">
              <Label htmlFor="edit-category">Categoria</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="edit-category"
                    value={formData.categoryName}
                    onChange={(e) => handleCategoryInputChange(e.target.value)}
                    onFocus={() => {
                      if (formData.categoryName.trim()) {
                        setShowCategorySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowCategorySuggestions(false), 200);
                    }}
                    placeholder="Digite a categoria"
                  />
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

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-costPrice">P. Custo</Label>
                <Input
                  id="edit-costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-salePrice">P. Venda</Label>
                <Input
                  id="edit-salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Cod. Barras */}
            <div>
              <Label htmlFor="edit-barcode">Cod. Barras</Label>
              <Input
                id="edit-barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Código de barras"
              />
            </div>

            {/* Observação */}
            <div>
              <Label htmlFor="edit-observation">Observação</Label>
              <Textarea
                id="edit-observation"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                placeholder="Observações"
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Imagem */}
            <div>
              <Label htmlFor="edit-image">Imagem</Label>
              <div className="flex gap-2 items-center">
                <Input
                  ref={fileInputRef}
                  id="edit-image"
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

            {/* Estoque */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground">Estoque Atual</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{currentStock}</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowStockDialog(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowTransferDialog(true)}
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="gap-2" disabled={loading}>
                <Save className="w-4 h-4" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ProductCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSelectCategory={handleSelectCategoryFromDialog}
      />

      <StockManagementDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        productName={product?.nome || ""}
      />
      <StockTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        productName={product?.nome || ""}
      />
    </>
  );
};