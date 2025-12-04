import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateEscolaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateEscolaDialog({ open, onOpenChange, onSuccess }: CreateEscolaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      slug: "",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Upload logo first if provided (we'll use a temporary ID)
      let logoUrl = null;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const tempId = crypto.randomUUID();
        const fileName = `${tempId}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("escolas")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Continue without logo if upload fails
        } else {
          const { data: publicUrl } = supabase.storage
            .from("escolas")
            .getPublicUrl(fileName);
          logoUrl = publicUrl.publicUrl;
        }
      }

      // Call edge function to create school and auth user
      const { data: result, error } = await supabase.functions.invoke("create-escola-user", {
        body: {
          email: data.email,
          password: data.senha,
          nome: data.nome,
          slug: data.slug,
          logoUrl,
        },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      toast.success("Escola cadastrada com sucesso!");
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating school:", error);
      toast.error(error.message || "Erro ao cadastrar escola");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Escola</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs text-slate-400 mt-1">Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Nome da Escola</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Nome da escola"
                      onChange={(e) => {
                        field.onChange(e);
                        const slug = generateSlug(e.target.value);
                        form.setValue("slug", slug);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Slug (Link de Cadastro)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">/cadastro/escola/</span>
                      <Input
                        {...field}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="minha-escola"
                      />
                    </div>
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
                  <FormLabel className="text-slate-300">Email de Acesso</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="email@escola.com"
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
