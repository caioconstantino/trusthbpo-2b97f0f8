import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, ShoppingBag } from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  preco_venda: number;
  imagem_url: string | null;
  quantidade: number;
}

const CatalogoPublico = () => {
  const { dominio } = useParams<{ dominio: string }>();
  const [empresa, setEmpresa] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!dominio) return;

    const fetchCatalogo = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("catalogo-publico", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          body: null,
        });

        // Use fetch directly since we need query params
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalogo-publico?dominio=${encodeURIComponent(dominio)}`;
        
        const res = await fetch(url, {
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Catálogo não encontrado");
          return;
        }

        setEmpresa(result.empresa);
        setProdutos(result.produtos || []);
      } catch (err: any) {
        setError("Erro ao carregar catálogo");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogo();
  }, [dominio]);

  const filtered = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{empresa}</h1>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Package className="w-4 h-4" />
            {filtered.length} produto(s)
          </Badge>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((produto) => (
              <div
                key={produto.id}
                className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {produto.imagem_url ? (
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2">{produto.nome}</h3>
                  <p className="text-primary font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(produto.preco_venda || 0)}
                  </p>
                  <Badge variant={produto.quantidade > 0 ? "secondary" : "destructive"} className="text-xs">
                    {produto.quantidade > 0 ? `${produto.quantidade} em estoque` : "Sem estoque"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CatalogoPublico;
