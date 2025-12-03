import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid3x3, Trash2, ChevronDown, Search, Loader2, LogOut, Banknote } from "lucide-react";
import { ProductGridDialog } from "@/components/ProductGridDialog";
import { FinalizeSaleDialog } from "@/components/FinalizeSaleDialog";
import { QuantityDialog } from "@/components/QuantityDialog";
import { OpenSessionDialog } from "@/components/OpenSessionDialog";
import { SangriaDialog } from "@/components/SangriaDialog";
import { CloseSessionDialog } from "@/components/CloseSessionDialog";
import { supabase } from "@/integrations/supabase/client";
import { usePdvSession } from "@/hooks/usePdvSession";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading, needsSession, openSession, closeSession, usuarioNome } = usePdvSession();
  
  const [customer, setCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showProductGrid, setShowProductGrid] = useState(false);
  const [showFinalizeSale, setShowFinalizeSale] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showSangriaDialog, setShowSangriaDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
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

  const handleOpenSession = async (valorAbertura: number, caixaNome: string) => {
    await openSession(valorAbertura, caixaNome);
  };

  const handleSangria = async (valor: number, motivo: string) => {
    toast({
      title: "Sangria registrada",
      description: `R$ ${valor.toFixed(2)} retirado do caixa`
    });
  };

  const handleCloseSession = async (valorFechamento: number, observacoes: string) => {
    const success = await closeSession(valorFechamento, observacoes);
    if (success) {
      setShowCloseDialog(false);
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Header Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Nome do cliente"
              className="mt-1 h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Vendedor</Label>
            <div className="mt-1 text-base font-semibold">{usuarioNome}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">PDV</Label>
            <div className="mt-1 text-base font-semibold">{session?.caixa_nome || "Sem sessão"}</div>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="bg-card border border-border rounded-lg p-3">
          <h3 className="text-base font-semibold mb-2">Adicionar Produto</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar por nome ou código..."
                className="pl-10 h-9"
              />
              {showProductSearch && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div>
                        <p className="font-medium text-sm">{product.nome}</p>
                        <p className="text-xs text-muted-foreground">#{product.codigo || product.id}</p>
                      </div>
                      <span className="font-semibold text-primary text-sm">
                        R$ {(product.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showProductSearch && searchProduct.length > 0 && filteredProducts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-3 text-center text-muted-foreground text-sm">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
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
                <TableHead className="w-16 text-xs">ID</TableHead>
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="w-28 text-xs">Preço</TableHead>
                <TableHead className="w-24 text-xs">Qtd</TableHead>
                <TableHead className="w-28 text-xs">Total</TableHead>
                <TableHead className="w-16 text-xs">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    Carrinho vazio
                  </TableCell>
                </TableRow>
              ) : (
                cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{item.id}</TableCell>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="text-sm">
                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-sm"
                        min="1"
                      />
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
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
          <div className="text-2xl font-bold">
            TOTAL: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-slate-700 hover:bg-slate-800 text-white h-12 text-base"
            onClick={handleFinalizeSale}
            disabled={cartItems.length === 0 || !session}
          >
            Finalizar Venda - F1
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 text-base gap-2"
              >
                Funções do Caixa
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowSangriaDialog(true)}>
                <Banknote className="w-4 h-4 mr-2" />
                Sangria
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowCloseDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Fechamento de Caixa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modals */}
      <OpenSessionDialog
        open={needsSession}
        onOpenChange={() => {}}
        onConfirm={handleOpenSession}
      />

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
        sessionId={session?.id || ""}
        customerName={customer}
        onComplete={() => {
          setCartItems([]);
          setCustomer("");
          setShowFinalizeSale(false);
        }}
      />

      <SangriaDialog
        open={showSangriaDialog}
        onOpenChange={setShowSangriaDialog}
        onConfirm={handleSangria}
      />

      <CloseSessionDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        sessionId={session?.id || ""}
        onConfirm={handleCloseSession}
      />
    </DashboardLayout>
  );
};

export default PDV;
