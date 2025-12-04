import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Copy, Trash2, Link } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface Professor {
  id: string;
  nome: string;
  email: string;
  slug: string;
  ativo: boolean;
  created_at: string;
}

interface Escola {
  id: number;
  nome: string;
  slug: string | null;
}

interface ManageProfessoresSheetProps {
  escola: Escola | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageProfessoresSheet({ escola, open, onOpenChange }: ManageProfessoresSheetProps) {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
    },
  });

  const { data: professores = [], isLoading: loadingProfessores } = useQuery({
    queryKey: ["professores", escola?.id],
    queryFn: async () => {
      if (!escola?.id) return [];
      const { data, error } = await supabase
        .from("tb_professores")
        .select("*")
        .eq("escola_id", escola.id)
        .order("nome");
      if (error) throw error;
      return data as Professor[];
    },
    enabled: !!escola?.id && open,
  });

  const generateSlug = (nome: string, escolaSlug: string | null) => {
    const baseSlug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${escolaSlug || "escola"}-${baseSlug}`;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tb_professores")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Professor removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["professores", escola?.id] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover professor");
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!escola) return;
    setIsLoading(true);
    
    try {
      const slug = generateSlug(data.nome, escola.slug);

      // Check if slug already exists
      const { data: existingSlug } = await supabase
        .from("tb_professores")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingSlug) {
        toast.error("Este slug já está em uso");
        setIsLoading(false);
        return;
      }

      // Create auth user for the professor
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      // Create professor record
      const { error: insertError } = await supabase
        .from("tb_professores")
        .insert({
          escola_id: escola.id,
          nome: data.nome,
          email: data.email,
          slug,
          auth_user_id: authData.user?.id,
        });

      if (insertError) throw insertError;

      toast.success("Professor cadastrado com sucesso!");
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["professores", escola.id] });
    } catch (error: any) {
      console.error("Error creating professor:", error);
      toast.error(error.message || "Erro ao cadastrar professor");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/cadastro/aluno/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl bg-slate-800 border-slate-700">
          <SheetHeader>
            <SheetTitle className="text-white">
              Professores - {escola?.nome}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Professor
              </Button>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 bg-slate-700/50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Nome do professor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            placeholder="email@professor.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Senha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => {
                        setShowForm(false);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">Lista de Professores</h3>
              
              {loadingProfessores ? (
                <div className="text-center py-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : professores.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhum professor cadastrado
                </div>
              ) : (
                <div className="space-y-2">
                  {professores.map((professor) => (
                    <div
                      key={professor.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{professor.nome}</p>
                        <p className="text-sm text-slate-400 truncate">{professor.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Link className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500 truncate">
                            /cadastro/aluno/{professor.slug}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={professor.ativo ? "default" : "secondary"}>
                          {professor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-white"
                          onClick={() => copyLink(professor.slug)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-destructive"
                          onClick={() => setDeleteId(professor.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover Professor</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja remover este professor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
