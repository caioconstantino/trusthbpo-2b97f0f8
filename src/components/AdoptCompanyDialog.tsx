import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Building2, Check, X } from "lucide-react";

const formSchema = z.object({
  razao_social: z.string().min(2, "Nome da empresa é obrigatório"),
  dominio: z.string().min(3, "Domínio deve ter no mínimo 3 caracteres").regex(/^[a-z0-9-]+$/, "Domínio deve conter apenas letras minúsculas, números e hífens"),
  cpf_cnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdoptCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoId: string;
}

export function AdoptCompanyDialog({ open, onOpenChange, alunoId }: AdoptCompanyDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dominioDisponivel, setDominioDisponivel] = useState<boolean | null>(null);
  const [verificandoDominio, setVerificandoDominio] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razao_social: "",
      dominio: "",
      cpf_cnpj: "",
      email: "",
      telefone: "",
      responsavel: "",
      observacoes: "",
    },
  });

  const verificarDominio = async (dominio: string) => {
    if (!dominio || dominio.length < 3) {
      setDominioDisponivel(null);
      return;
    }

    setVerificandoDominio(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-customer-data", {
        body: { dominio },
      });

      if (error) throw error;
      setDominioDisponivel(!data.cliente);
    } catch (error) {
      console.error("Erro ao verificar domínio:", error);
      setDominioDisponivel(null);
    } finally {
      setVerificandoDominio(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!dominioDisponivel) {
      toast({
        title: "Erro",
        description: "O domínio escolhido não está disponível.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Usar edge function para criar a empresa (bypass RLS)
      const { data, error } = await supabase.functions.invoke("adopt-company", {
        body: {
          aluno_id: alunoId,
          razao_social: values.razao_social,
          dominio: values.dominio,
          cpf_cnpj: values.cpf_cnpj || null,
          email: values.email || null,
          telefone: values.telefone || null,
          responsavel: values.responsavel || null,
          observacoes: values.observacoes || null,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Empresa adotada com sucesso!",
        description: `A empresa "${values.razao_social}" foi criada com o domínio "${values.dominio}". Licença educacional válida por 1 ano.`,
      });

      form.reset();
      setDominioDisponivel(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao adotar empresa:", error);
      toast({
        title: "Erro ao adotar empresa",
        description: error.message || "Ocorreu um erro ao criar a empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Adotar uma Empresa
          </DialogTitle>
          <DialogDescription>
            Cadastre uma empresa para praticar suas habilidades de gestão empresarial. 
            Você receberá uma licença educacional gratuita por 1 ano.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Loja Virtual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dominio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio de Acesso *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="minha-loja"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                          field.onChange(value);
                          verificarDominio(value);
                        }}
                        className={`pr-10 ${
                          dominioDisponivel === true
                            ? "border-green-500 focus-visible:ring-green-500"
                            : dominioDisponivel === false
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {verificandoDominio ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : dominioDisponivel === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : dominioDisponivel === false ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : null}
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Este será o identificador único da empresa para login
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a empresa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !dominioDisponivel}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Adotar Empresa"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
