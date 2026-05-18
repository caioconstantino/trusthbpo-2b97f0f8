import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScanLine, ShoppingCart, Plus, Minus, Trash2, X, QrCode, CreditCard, CheckCircle2, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

type Produto = {
  id: number; nome: string; codigo: string | null; codigo_barras: string | null;
  preco_venda: number; imagem_url: string | null; categoria_id: number | null; estoque: number | null;
};
type Categoria = { id: number; nome: string };
type TotemInfo = { id: string; nome: string; cor_primaria: string | null; logo_url: string | null; pix_ativo: boolean; cartao_confianca: boolean; dominio: string; unidade_id: number | null };
type CartItem = { id: number; nome: string; preco: number; quantidade: number };

type Step = "atrair" | "catalogo" | "cpf" | "metodo" | "pix" | "cartao" | "sucesso";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Totem() {
  const { slug = "" } = useParams();
  const [step, setStep] = useState<Step>("atrair");
  const [totem, setTotem] = useState<TotemInfo | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  // PIX
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);

  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<number | null>(null);

  // Carregar catálogo
  useEffect(() => {
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/totem-catalogo?slug=${encodeURIComponent(slug)}`;
        const r = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setTotem(data.totem); setProdutos(data.produtos); setCategorias(data.categorias);
        const usados = new Set((data.produtos as Produto[]).map((p) => p.categoria_id).filter(Boolean));
        const visiveis = (data.categorias as Categoria[]).filter((c) => usados.has(c.id));
        setCategorias(visiveis);
      } catch (e: any) {
        toast.error(e.message || "Erro ao carregar totem");
      }
    })();
  }, [slug]);

  // Scanner: captura entrada rápida via teclado HID
  useEffect(() => {
    if (step !== "catalogo") return;
    const handler = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
      if (e.key === "Enter") {
        const code = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        if (code.length >= 4) addByCode(code);
        return;
      }
      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
        scanTimerRef.current = window.setTimeout(() => { scanBufferRef.current = ""; }, 250);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const addByCode = (code: string) => {
    const p = produtos.find((x) => x.codigo_barras === code || x.codigo === code);
    if (p) { addToCart(p); toast.success(`${p.nome} adicionado`); }
    else toast.error(`Código ${code} não encontrado`);
  };

  const addToCart = (p: Produto) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...c, { id: p.id, nome: p.nome, preco: Number(p.preco_venda) || 0, quantidade: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((c) => c.flatMap((i) => {
      if (i.id !== id) return [i];
      const q = i.quantidade + delta;
      return q <= 0 ? [] : [{ ...i, quantidade: q }];
    }));
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.preco * i.quantidade, 0), [cart]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (categoriaAtiva && p.categoria_id !== categoriaAtiva) return false;
      if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [produtos, categoriaAtiva, busca]);

  const corPrimaria = totem?.cor_primaria || "#2563eb";

  // ---------- PAGAMENTO PIX ----------
  const iniciarPix = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/totem-criar-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ totemSlug: slug, cartItems: cart, total, cpf }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro PIX");
      setPixOrderId(data.order_id);
      setPixQrCode(data.qr_code);
      setStep("pix");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // Polling do pagamento
  useEffect(() => {
    if (step !== "pix" || !pixOrderId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/totem-status-pagamento`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ orderId: pixOrderId }),
        });
        const data = await r.json();
        if (cancelled) return;
        if (data.paid) {
          await finalizarVenda("pix", pixOrderId, pixQrCode || undefined);
        }
      } catch {}
    };
    const id = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [step, pixOrderId, pixQrCode]);

  const finalizarVenda = async (forma: "pix" | "cartao_maquininha", txId?: string, qr?: string) => {
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/totem-finalizar-venda`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          totemSlug: slug, cartItems: cart, total, cpf,
          formaPagamento: forma, transactionIdExterno: txId, qrCode: qr,
        }),
      });
      if (!r.ok) throw new Error("erro finalizar");
      setStep("sucesso");
      setTimeout(() => resetar(), 6000);
    } catch (e: any) { toast.error(e.message); }
  };

  const resetar = () => {
    setCart([]); setCpf(""); setPixOrderId(null); setPixQrCode(null);
    setBusca(""); setCategoriaAtiva(null); setStep("atrair");
  };

  if (!totem) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Carregando totem...</div>;
  }

  // ---------- TELA: ATRAIR ----------
  if (step === "atrair") {
    return (
      <button
        onClick={() => setStep("catalogo")}
        className="min-h-screen w-full flex flex-col items-center justify-center text-white text-center p-12"
        style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}dd)` }}
      >
        {totem.logo_url && <img src={totem.logo_url} alt="" className="h-32 mb-8 object-contain" />}
        <h1 className="text-7xl font-bold mb-4">{totem.nome}</h1>
        <p className="text-3xl opacity-90 mb-16">Autoatendimento</p>
        <div className="text-4xl font-medium border-4 border-white/40 rounded-full px-12 py-6 animate-pulse">
          Toque para começar
        </div>
      </button>
    );
  }

  // ---------- TELA: SUCESSO ----------
  if (step === "sucesso") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-green-900 p-12 text-center">
        <CheckCircle2 className="w-48 h-48 mb-8 text-green-600" />
        <h1 className="text-6xl font-bold mb-4">Pagamento confirmado!</h1>
        <p className="text-3xl mb-2">Retire seus produtos</p>
        <p className="text-2xl opacity-70 mt-8">Obrigado pela compra</p>
      </div>
    );
  }

  // ---------- TELA: PIX ----------
  if (step === "pix") {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col items-center">
        <Button variant="ghost" size="lg" onClick={() => setStep("metodo")} className="self-start text-xl">
          <ArrowLeft className="mr-2" /> Voltar
        </Button>
        <div className="max-w-xl w-full bg-card rounded-3xl shadow-xl p-10 mt-4 text-center">
          <QrCode className="w-16 h-16 mx-auto mb-4" style={{ color: corPrimaria }} />
          <h2 className="text-4xl font-bold mb-2">Pague com PIX</h2>
          <p className="text-xl text-muted-foreground mb-6">Escaneie o QR Code com o app do seu banco</p>
          {pixQrCode && (
            <div className="bg-white p-4 rounded-2xl inline-block mb-6">
              <img alt="QR Code PIX" className="w-72 h-72" src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixQrCode)}`} />
            </div>
          )}
          <div className="text-5xl font-bold mb-2" style={{ color: corPrimaria }}>{fmt(total)}</div>
          <p className="text-lg text-muted-foreground">Aguardando pagamento...</p>
        </div>
      </div>
    );
  }

  // ---------- TELA: CARTÃO MAQUININHA ----------
  if (step === "cartao") {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col items-center">
        <Button variant="ghost" size="lg" onClick={() => setStep("metodo")} className="self-start text-xl">
          <ArrowLeft className="mr-2" /> Voltar
        </Button>
        <div className="max-w-xl w-full bg-card rounded-3xl shadow-xl p-10 mt-4 text-center">
          <CreditCard className="w-24 h-24 mx-auto mb-4" style={{ color: corPrimaria }} />
          <h2 className="text-4xl font-bold mb-2">Passe o cartão na maquininha</h2>
          <p className="text-xl text-muted-foreground mb-8">Após concluir, toque em "Confirmar pagamento"</p>
          <div className="text-6xl font-bold mb-8" style={{ color: corPrimaria }}>{fmt(total)}</div>
          <Button
            size="lg"
            className="w-full text-2xl h-20"
            style={{ background: corPrimaria }}
            onClick={() => finalizarVenda("cartao_maquininha")}
          >
            Confirmar pagamento
          </Button>
        </div>
      </div>
    );
  }

  // ---------- TELA: MÉTODO DE PAGAMENTO ----------
  if (step === "metodo") {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col">
        <Button variant="ghost" size="lg" onClick={() => setStep(totem.pix_ativo ? "cpf" : "catalogo")} className="self-start text-xl">
          <ArrowLeft className="mr-2" /> Voltar
        </Button>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto w-full">
          <h2 className="text-5xl font-bold mb-2">Como deseja pagar?</h2>
          <div className="text-4xl font-bold mb-8" style={{ color: corPrimaria }}>{fmt(total)}</div>
          {totem.pix_ativo && (
            <Button size="lg" className="w-full h-32 text-3xl" style={{ background: corPrimaria }} onClick={iniciarPix} disabled={loading}>
              <QrCode className="mr-4 !w-10 !h-10" /> PIX
            </Button>
          )}
          {totem.cartao_confianca && (
            <Button size="lg" variant="outline" className="w-full h-32 text-3xl border-2" onClick={() => setStep("cartao")}>
              <CreditCard className="mr-4 !w-10 !h-10" /> Cartão (maquininha)
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---------- TELA: CPF ----------
  if (step === "cpf") {
    const digit = (d: string) => setCpf((c) => (c.replace(/\D/g, "").length >= 11 ? c : c + d));
    const back = () => setCpf((c) => c.slice(0, -1));
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col">
        <Button variant="ghost" size="lg" onClick={() => setStep("catalogo")} className="self-start text-xl">
          <ArrowLeft className="mr-2" /> Voltar ao carrinho
        </Button>
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <h2 className="text-4xl font-bold mb-2">CPF na nota?</h2>
          <p className="text-xl text-muted-foreground mb-8">Digite seu CPF ou pule</p>
          <div className="w-full bg-card border-2 rounded-2xl px-6 py-6 text-4xl font-mono text-center mb-6 tracking-widest min-h-[80px]">
            {cpf || "—"}
          </div>
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {["1","2","3","4","5","6","7","8","9"].map((n) => (
              <Button key={n} size="lg" variant="outline" className="h-20 text-3xl" onClick={() => digit(n)}>{n}</Button>
            ))}
            <Button size="lg" variant="outline" className="h-20 text-xl" onClick={back}>←</Button>
            <Button size="lg" variant="outline" className="h-20 text-3xl" onClick={() => digit("0")}>0</Button>
            <Button size="lg" variant="outline" className="h-20 text-xl" onClick={() => setCpf("")}>C</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button size="lg" variant="outline" className="h-16 text-xl" onClick={() => { setCpf(""); setStep("metodo"); }}>
              Pular
            </Button>
            <Button size="lg" className="h-16 text-xl" style={{ background: corPrimaria }} onClick={() => setStep("metodo")}>
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- TELA: CATÁLOGO ----------
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Catálogo */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 flex items-center gap-4">
          {totem.logo_url && <img src={totem.logo_url} alt="" className="h-12" />}
          <h1 className="text-2xl font-bold flex-1">{totem.nome}</h1>
          <Badge variant="secondary" className="text-sm gap-2"><ScanLine className="w-4 h-4" /> Pronto p/ leitor</Badge>
        </header>

        <div className="p-4 bg-card border-b flex gap-2 items-center">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="text-lg h-12" />
        </div>

        <div className="px-4 py-3 bg-card border-b overflow-x-auto whitespace-nowrap">
          <Button size="sm" variant={categoriaAtiva === null ? "default" : "outline"} className="mr-2" onClick={() => setCategoriaAtiva(null)}>Todos</Button>
          {categorias.map((c) => (
            <Button key={c.id} size="sm" variant={categoriaAtiva === c.id ? "default" : "outline"} className="mr-2" onClick={() => setCategoriaAtiva(c.id)}>
              {c.nome}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="bg-card rounded-2xl border-2 hover:border-primary p-3 text-left transition active:scale-95">
              <div className="aspect-square bg-muted rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                  : <Package className="w-12 h-12 text-muted-foreground" />}
              </div>
              <div className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{p.nome}</div>
              <div className="text-lg font-bold mt-1" style={{ color: corPrimaria }}>{fmt(Number(p.preco_venda) || 0)}</div>
            </button>
          ))}
          {produtosFiltrados.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">Nenhum produto encontrado</div>
          )}
        </div>
      </div>

      {/* Carrinho */}
      <aside className="w-96 bg-card border-l flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          <h2 className="text-xl font-bold flex-1">Carrinho</h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setCart([])}><Trash2 className="w-4 h-4" /></Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="text-center text-muted-foreground py-12">Toque nos produtos para adicionar</div>
          )}
          {cart.map((i) => (
            <div key={i.id} className="bg-muted/40 rounded-xl p-3">
              <div className="font-medium text-sm mb-2">{i.nome}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQty(i.id, -1)}><Minus className="w-4 h-4" /></Button>
                  <span className="w-8 text-center font-bold">{i.quantidade}</span>
                  <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQty(i.id, 1)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="font-bold">{fmt(i.preco * i.quantidade)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>Total</span><span style={{ color: corPrimaria }}>{fmt(total)}</span>
          </div>
          <Button size="lg" className="w-full h-16 text-xl" style={{ background: corPrimaria }}
            disabled={cart.length === 0} onClick={() => setStep("cpf")}>
            Finalizar pedido
          </Button>
        </div>
      </aside>
    </div>
  );
}

// Pequeno fallback para Package icon (evita import duplicado)
function Package({ className }: { className?: string }) {
  return <ShoppingCart className={className} />;
}