import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown, Building2, Users, ShoppingCart } from "lucide-react";

interface OfertasEspeciaisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const produtos = [
  {
    id: 1,
    nome: "Plano Básico",
    descricao: "Ideal para pequenos negócios",
    preco: 39.90,
    precoOriginal: 59.90,
    icon: Zap,
    features: [
      "1 usuário incluído",
      "1 empresa (Matriz)",
      "1 PDV incluído",
      "500 produtos",
      "Suporte por email",
    ],
    destaque: false,
    cor: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    nome: "Plano Profissional",
    descricao: "Para empresas em crescimento",
    preco: 99.90,
    precoOriginal: 149.90,
    icon: Crown,
    features: [
      "5 usuários incluídos",
      "2 empresas incluídas",
      "2 PDVs incluídos",
      "Produtos ilimitados",
      "Suporte prioritário",
      "Relatórios avançados",
    ],
    destaque: true,
    cor: "from-amber-500 to-orange-500",
  },
  {
    id: 3,
    nome: "PDV Adicional",
    descricao: "Expanda seus pontos de venda",
    preco: 10.00,
    precoOriginal: null,
    icon: ShoppingCart,
    features: [
      "1 PDV adicional",
      "Integração completa",
      "Controle de caixa",
    ],
    destaque: false,
    cor: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    nome: "Empresa Adicional",
    descricao: "Gerencie múltiplas empresas",
    preco: 10.00,
    precoOriginal: null,
    icon: Building2,
    features: [
      "1 empresa adicional",
      "Dados separados",
      "Gestão independente",
    ],
    destaque: false,
    cor: "from-purple-500 to-pink-500",
  },
  {
    id: 5,
    nome: "Usuário Adicional",
    descricao: "Adicione mais colaboradores",
    preco: 10.00,
    precoOriginal: null,
    icon: Users,
    features: [
      "1 usuário adicional",
      "Permissões personalizadas",
      "Acesso controlado",
    ],
    destaque: false,
    cor: "from-indigo-500 to-violet-500",
  },
];

export function OfertasEspeciaisDialog({ open, onOpenChange }: OfertasEspeciaisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Ofertas Especiais
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {produtos.map((produto) => (
            <Card 
              key={produto.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                produto.destaque ? "ring-2 ring-amber-500" : ""
              }`}
            >
              {produto.destaque && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500">
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${produto.cor} flex items-center justify-center mb-3`}>
                  <produto.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{produto.nome}</CardTitle>
                <CardDescription>{produto.descricao}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      R$ {produto.preco.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  {produto.precoOriginal && (
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {produto.precoOriginal.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {produto.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    produto.destaque 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                      : ""
                  }`}
                  variant={produto.destaque ? "default" : "outline"}
                >
                  {produto.preco <= 10 ? "Adicionar" : "Contratar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 Dúvidas? Entre em contato com nosso suporte para conhecer todas as vantagens de cada plano.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
