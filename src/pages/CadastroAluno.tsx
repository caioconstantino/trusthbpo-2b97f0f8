import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, CheckCircle } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  endereco_cep: z.string().min(8, "CEP inválido"),
  endereco_logradouro: z.string().min(2, "Logradouro é obrigatório"),
  endereco_numero: z.string().min(1, "Número é obrigatório"),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().min(2, "Bairro é obrigatório"),
  endereco_cidade: z.string().min(2, "Cidade é obrigatória"),
  endereco_estado: z.string().length(2, "Estado deve ter 2 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface Professor {
  id: string;
  nome: string;
  escola_id: number;
  escola?: {
    id: number;
    nome: string;
    logo_url: string | null;
  };
}

export default function CadastroAluno() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: "",
      endereco_cep: "",
      endereco_logradouro: "",
      endereco_numero: "",
      endereco_complemento: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_estado: "",
    },
  });

  useEffect(() => {
    const fetchProfessor = async () => {
      if (!slug) return;
      
      try {
        const { data: profData, error: profError } = await supabase
          .from("tb_professores")
          .select("id, nome, escola_id")
          .eq("slug", slug)
          .eq("ativo", true)
          .single();

        if (profError || !profData) {
          toast.error("Link de cadastro inválido");
          navigate("/");
          return;
        }

        const { data: escolaData } = await supabase
          .from("tb_escolas")
          .select("id, nome, logo_url")
          .eq("id", profData.escola_id)
          .single();

        setProfessor({
          ...profData,
          escola: escolaData || undefined,
        });
      } catch (error) {
        console.error("Error fetching professor:", error);
        toast.error("Erro ao carregar dados");
        navigate("/");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProfessor();
  }, [slug, navigate]);

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue("endereco_logradouro", data.logradouro || "");
        form.setValue("endereco_bairro", data.bairro || "");
        form.setValue("endereco_cidade", data.localidade || "");
        form.setValue("endereco_estado", data.uf || "");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const onSubmit = async (data: FormData) => {
    if (!professor) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("tb_alunos")
        .insert({
          professor_id: professor.id,
          escola_id: professor.escola_id,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          cpf: data.cpf.replace(/\D/g, ""),
          data_nascimento: data.data_nascimento,
          endereco_cep: data.endereco_cep.replace(/\D/g, ""),
          endereco_logradouro: data.endereco_logradouro,
          endereco_numero: data.endereco_numero,
          endereco_complemento: data.endereco_complemento || null,
          endereco_bairro: data.endereco_bairro,
          endereco_cidade: data.endereco_cidade,
          endereco_estado: data.endereco_estado.toUpperCase(),
        });

      if (error) throw error;

      setSuccess(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      console.error("Error registering student:", error);
      toast.error(error.message || "Erro ao realizar cadastro");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Cadastro Realizado!</h2>
            <p className="text-slate-400 mb-6">
              Seu cadastro foi realizado com sucesso. Em breve você receberá mais informações.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="border-slate-600 text-slate-300">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {professor?.escola?.logo_url ? (
            <img
              src={professor.escola.logo_url}
              alt={professor.escola.nome}
              className="w-24 h-24 rounded-xl mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{professor?.escola?.nome}</h1>
          <p className="text-slate-400 mt-1">Professor(a): {professor?.nome}</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cadastro de Aluno</CardTitle>
            <CardDescription className="text-slate-400">
              Preencha seus dados para se cadastrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Seu nome completo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="seu@email.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="(00) 00000-0000"
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">CPF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="000.000.000-00"
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h3 className="text-white font-medium mb-4">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="endereco_cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">CEP</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="00000-000"
                              onChange={(e) => {
                                const formatted = formatCEP(e.target.value);
                                field.onChange(formatted);
                                fetchAddressByCep(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco_logradouro"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-300">Logradouro</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="Rua, Avenida, etc."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="endereco_numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Número</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="123"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco_complemento"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-slate-300">Complemento</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="Apto, Bloco, etc. (opcional)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="endereco_bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Bairro</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="Bairro"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco_cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Cidade</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="Cidade"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco_estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Estado</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="UF"
                              maxLength={2}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Realizar Cadastro"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
