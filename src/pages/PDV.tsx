import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Grid3x3, Trash2, Maximize2, Search } from "lucide-react";
import { ProductGridDialog } from "@/components/ProductGridDialog";
import { FinalizeSaleDialog } from "@/components/FinalizeSaleDialog";
import { QuantityDialog } from "@/components/QuantityDialog";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: number;
  nome: string;
  preco_venda: number;
  codigo: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
}

const PDV = () => {
  const [customer, setCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showProductGrid, setShowProductGrid] = useState(false);
  const [showFinalizeSale, setShowFinalizeSale] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const dominio = localStorage.getItem("user_dominio");
    if (!dominio) return;

    const { data, error } = await supabase
      .from("tb_produtos")
      .select("id, nome, preco_venda, codigo")
      .eq("dominio", dominio)
      .eq("ativo", true)
      .order("nome");

    if (!error && data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    if (searchProduct.length > 0) {
      const filtered = products.filter(p => 
        p.nome.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchProduct.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowProductSearch(true);
    } else {
      setFilteredProducts([]);
      setShowProductSearch(false);
    }
  }, [searchProduct, products]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct({
      id: product.id.toString(),
      name: product.nome,
      price: product.preco_venda || 0
    });
    setSearchProduct("");
    setShowProductSearch(false);
    setShowQuantityDialog(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      handleSelectProduct(filteredProducts[0]);
    }
  };

  const handleProductFromGrid = (product: { id: string; name: string; price: number }) => {
    setSelectedProduct(product);
    setShowProductGrid(false);
    setShowQuantityDialog(true);
  };

  const addToCartWithQuantity = (product: { id: string; name: string; price: number }, quantity: number) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
    }
  };

  const addToCart = (product: { id: string; name: string; price: number }) => {
    addToCartWithQuantity(product, 1);
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeSale = () => {
    if (cartItems.length === 0) return;
    setShowFinalizeSale(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Header Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Cliente</Label>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Nome do cliente"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Vendedor</Label>
            <div className="mt-1 text-lg font-semibold">GOGAR</div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">PDV</Label>
            <div className="mt-1 text-lg font-semibold">Caixa 1</div>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Adicionar Produto</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar por nome ou código..."
                className="pl-10"
              />
              {showProductSearch && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="px-4 py-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div>
                        <p className="font-medium">{product.nome}</p>
                        <p className="text-xs text-muted-foreground">#{product.codigo || product.id}</p>
                      </div>
                      <span className="font-semibold text-primary">
                        R$ {(product.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showProductSearch && searchProduct.length > 0 && filteredProducts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-4 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowProductGrid(true)}
              title="Abrir grade de produtos"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-32">Preço</TableHead>
                <TableHead className="w-32">Quantidade</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-24">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Carrinho vazio
                  </TableCell>
                </TableRow>
              ) : (
                cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            TOTAL: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="bg-slate-700 hover:bg-slate-800 text-white h-16 text-lg"
            onClick={handleFinalizeSale}
            disabled={cartItems.length === 0}
          >
            Finalizar Venda - F1
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-16 text-lg gap-2"
          >
            Funções do Caixa - F9
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ProductGridDialog
        open={showProductGrid}
        onOpenChange={setShowProductGrid}
        onAddProduct={handleProductFromGrid}
      />

      <QuantityDialog
        open={showQuantityDialog}
        onOpenChange={setShowQuantityDialog}
        product={selectedProduct}
        onConfirm={addToCartWithQuantity}
      />

      <FinalizeSaleDialog
        open={showFinalizeSale}
        onOpenChange={setShowFinalizeSale}
        cartItems={cartItems}
        total={total}
        onComplete={() => {
          setCartItems([]);
          setShowFinalizeSale(false);
        }}
      />
    </DashboardLayout>
  );
};

export default PDV;
