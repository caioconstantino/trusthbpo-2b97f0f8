import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, ExternalLink, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OfertaProduto {
  id: string;
  nome: string;
  descricao: string | null;
  funcionalidades: string[];
  desconto_percentual: number;
  link: string | null;
  imagem_url: string | null;
}

interface OfertasEspeciaisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfertasEspeciaisDialog({ open, onOpenChange }: OfertasEspeciaisDialogProps) {
  const [ofertas, setOfertas] = useState<OfertaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchOfertas();
    }
  }, [open]);

  const fetchOfertas = async () => {
    try {
      const { data, error } = await supabase
        .from("tb_ofertas_produtos")
        .select("id, nome, descricao, funcionalidades, desconto_percentual, link, imagem_url")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      setOfertas(data || []);
    } catch (error) {
      console.error("Erro ao carregar ofertas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Ofertas Especiais
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Carregando ofertas...</div>
          </div>
        ) : ofertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma oferta disponível</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Volte em breve para conferir nossas promoções!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {ofertas.map((oferta) => (
              <Card 
                key={oferta.id} 
                className="relative overflow-hidden transition-all duration-300 hover:shadow-lg group"
              >
                {oferta.desconto_percentual > 0 && (
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 z-10">
                    <Percent className="h-3 w-3 mr-1" />
                    {oferta.desconto_percentual}% OFF
                  </Badge>
                )}
                
                {oferta.imagem_url && (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={oferta.imagem_url} 
                      alt={oferta.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <CardHeader className={oferta.imagem_url ? "pb-2" : "pb-2 pt-6"}>
                  <CardTitle className="text-lg">{oferta.nome}</CardTitle>
                  {oferta.descricao && (
                    <CardDescription className="line-clamp-2">{oferta.descricao}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  {oferta.funcionalidades && oferta.funcionalidades.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {oferta.funcionalidades.map((func, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{func}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {oferta.link && (
                    <Button 
                      className="w-full gap-2"
                      onClick={() => handleOpenLink(oferta.link!)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Saiba mais
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 Dúvidas? Entre em contato com nosso suporte para conhecer todas as vantagens.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
