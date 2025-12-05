import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Check, Loader2, Minus, Plus, Users, Building, Monitor, Calendar, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.webp";

const PLANS = {
  Essencial: {
    name: "Essencial",
    basePrice: 3990, // centavos
    includedUsers: 1,
    includedCompanies: 1,
    includedPdvs: 1,
    maxProducts: 500,
  },
  Profissional: {
    name: "Profissional",
    basePrice: 9990, // centavos
    includedUsers: 5,
    includedCompanies: 2,
    includedPdvs: 1,
    maxProducts: "Ilimitado",
  }
};

const ADDITIONAL_PRICES = {
  user: 1000, // R$10,00 por usuário adicional
  company: 1000, // R$10,00 por empresa adicional
  pdv: 1000, // R$10,00 por PDV adicional
};

const ANNUAL_DISCOUNT = 0.18; // 18% desconto

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const initialPlan = searchParams.get("plano") === "Profissional" ? "Profissional" : "Essencial";
  
  const [selectedPlan, setSelectedPlan] = useState<"Essencial" | "Profissional">(initialPlan);
  const [billingPeriod, setBillingPeriod] = useState<"mensal" | "anual">("mensal");
  const [additionalUsers, setAdditionalUsers] = useState(0);
  const [additionalCompanies, setAdditionalCompanies] = useState(0);
  const [additionalPdvs, setAdditionalPdvs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const plan = PLANS[selectedPlan];

  const calculations = useMemo(() => {
    const basePriceMonthly = plan.basePrice;
    const additionalUsersCost = additionalUsers * ADDITIONAL_PRICES.user;
    const additionalCompaniesCost = additionalCompanies * ADDITIONAL_PRICES.company;
    const additionalPdvsCost = additionalPdvs * ADDITIONAL_PRICES.pdv;
    
    const monthlyTotal = basePriceMonthly + additionalUsersCost + additionalCompaniesCost + additionalPdvsCost;
    
    if (billingPeriod === "anual") {
      const annualTotal = monthlyTotal * 12;
      const discount = annualTotal * ANNUAL_DISCOUNT;
      const finalTotal = annualTotal - discount;
      return {
        monthlyBase: monthlyTotal,
        annualTotal,
        discount,
        finalTotal,
        displayTotal: finalTotal,
        displayPeriod: "ano",
        monthlyEquivalent: finalTotal / 12
      };
    }
    
    return {
      monthlyBase: monthlyTotal,
      annualTotal: 0,
      discount: 0,
      finalTotal: monthlyTotal,
      displayTotal: monthlyTotal,
      displayPeriod: "mês",
      monthlyEquivalent: monthlyTotal
    };
  }, [plan, additionalUsers, additionalCompanies, additionalPdvs, billingPeriod]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pagarme-create-link', {
        body: {
          planName: selectedPlan,
          planPrice: calculations.displayTotal,
          billingPeriod,
          additionalUsers,
          additionalCompanies,
          additionalPdvs,
        }
      });

      if (error) {
        console.error('Error creating payment link:', error);
        toast({
          title: "Erro ao criar link de pagamento",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive"
        });
        return;
      }

      if (data?.paymentLink) {
        window.open(data.paymentLink, '_blank');
        toast({
          title: "Link de pagamento criado!",
          description: "Você será redirecionado para finalizar o pagamento"
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: "Não foi possível gerar o link de pagamento",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const QuantityControl = ({ 
    value, 
    onChange, 
    min = 0 
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    min?: number;
  }) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium">{value}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logo} alt="TrustHBPO Logo" className="h-10 object-contain" />
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Checkout Seguro
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Personalize seu plano
          </h1>
          <p className="text-muted-foreground">
            Escolha os recursos adicionais que seu negócio precisa
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configurações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plano Base</CardTitle>
                <CardDescription>Selecione o plano que melhor atende suas necessidades</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={(val) => setSelectedPlan(val as "Essencial" | "Profissional")}
                  className="grid md:grid-cols-2 gap-4"
                >
                  {Object.entries(PLANS).map(([key, p]) => (
                    <Label
                      key={key}
                      htmlFor={key}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPlan === key 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={key} id={key} className="sr-only" />
                      {key === "Profissional" && (
                        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                          Popular
                        </Badge>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{p.name}</span>
                        {selectedPlan === key && <Check className="h-5 w-5 text-primary" />}
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        R$ {formatPrice(p.basePrice)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </span>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>• {p.includedUsers} usuário{p.includedUsers > 1 ? 's' : ''} incluído{p.includedUsers > 1 ? 's' : ''}</p>
                        <p>• {p.includedCompanies} empresa{p.includedCompanies > 1 ? 's' : ''} incluída{p.includedCompanies > 1 ? 's' : ''}</p>
                        <p>• {p.includedPdvs} PDV incluído</p>
                        <p>• {p.maxProducts} produtos</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Período de Cobrança */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Período de Cobrança
                </CardTitle>
                <CardDescription>Economize 18% no plano anual</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={billingPeriod}
                  onValueChange={(val) => setBillingPeriod(val as "mensal" | "anual")}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="mensal"
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      billingPeriod === "mensal" 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <RadioGroupItem value="mensal" id="mensal" className="sr-only" />
                      <span className="font-semibold">Mensal</span>
                      <p className="text-sm text-muted-foreground">Cobrado todo mês</p>
                    </div>
                    {billingPeriod === "mensal" && <Check className="h-5 w-5 text-primary" />}
                  </Label>
                  <Label
                    htmlFor="anual"
                    className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      billingPeriod === "anual" 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      -18%
                    </Badge>
                    <div>
                      <RadioGroupItem value="anual" id="anual" className="sr-only" />
                      <span className="font-semibold">Anual</span>
                      <p className="text-sm text-muted-foreground">Cobrado uma vez por ano</p>
                    </div>
                    {billingPeriod === "anual" && <Check className="h-5 w-5 text-primary" />}
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Recursos Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recursos Adicionais</CardTitle>
                <CardDescription>Adicione mais recursos conforme sua necessidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Usuários Adicionais */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Usuários Adicionais</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.includedUsers} incluído{plan.includedUsers > 1 ? 's' : ''} • R$ 10,00/cada adicional
                      </p>
                    </div>
                  </div>
                  <QuantityControl value={additionalUsers} onChange={setAdditionalUsers} />
                </div>

                <Separator />

                {/* Empresas Adicionais */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Building className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">Empresas Adicionais</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.includedCompanies} incluída{plan.includedCompanies > 1 ? 's' : ''} • R$ 10,00/cada adicional
                      </p>
                    </div>
                  </div>
                  <QuantityControl value={additionalCompanies} onChange={setAdditionalCompanies} />
                </div>

                <Separator />

                {/* PDVs Adicionais */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Monitor className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">PDVs Adicionais</p>
                      <p className="text-sm text-muted-foreground">
                        1 incluído • R$ 10,00/cada adicional
                      </p>
                    </div>
                  </div>
                  <QuantityControl value={additionalPdvs} onChange={setAdditionalPdvs} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-primary/20">
              <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano {plan.name}</span>
                    <span className="font-medium">R$ {formatPrice(plan.basePrice)}/mês</span>
                  </div>
                  
                  {additionalUsers > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{additionalUsers} usuário{additionalUsers > 1 ? 's' : ''} adicional</span>
                      <span>R$ {formatPrice(additionalUsers * ADDITIONAL_PRICES.user)}/mês</span>
                    </div>
                  )}
                  
                  {additionalCompanies > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{additionalCompanies} empresa{additionalCompanies > 1 ? 's' : ''} adicional</span>
                      <span>R$ {formatPrice(additionalCompanies * ADDITIONAL_PRICES.company)}/mês</span>
                    </div>
                  )}
                  
                  {additionalPdvs > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{additionalPdvs} PDV{additionalPdvs > 1 ? 's' : ''} adicional</span>
                      <span>R$ {formatPrice(additionalPdvs * ADDITIONAL_PRICES.pdv)}/mês</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal mensal</span>
                  <span className="font-medium">R$ {formatPrice(calculations.monthlyBase)}/mês</span>
                </div>

                {billingPeriod === "anual" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">× 12 meses</span>
                      <span>R$ {formatPrice(calculations.annualTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto 18%</span>
                      <span>- R$ {formatPrice(calculations.discount)}</span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      R$ {formatPrice(calculations.displayTotal)}
                    </span>
                    <span className="text-muted-foreground">/{calculations.displayPeriod}</span>
                    {billingPeriod === "anual" && (
                      <p className="text-xs text-muted-foreground">
                        (equivalente a R$ {formatPrice(calculations.monthlyEquivalent)}/mês)
                      </p>
                    )}
                  </div>
                </div>

                {/* Recursos incluídos */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Recursos incluídos:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {plan.includedUsers + additionalUsers} usuário{(plan.includedUsers + additionalUsers) > 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {plan.includedCompanies + additionalCompanies} empresa{(plan.includedCompanies + additionalCompanies) > 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {plan.includedPdvs + additionalPdvs} PDV{(plan.includedPdvs + additionalPdvs) > 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {plan.maxProducts} produtos
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button 
                  className="w-full group" 
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando link...
                    </>
                  ) : (
                    <>
                      Finalizar Contratação
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Pagamento seguro via Pagar.me
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
