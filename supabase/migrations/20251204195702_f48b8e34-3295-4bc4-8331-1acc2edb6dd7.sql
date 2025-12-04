-- Update tb_escolas with additional fields
ALTER TABLE public.tb_escolas 
ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE,
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create tb_professores table
CREATE TABLE IF NOT EXISTS public.tb_professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escola_id INTEGER NOT NULL REFERENCES public.tb_escolas(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, escola_id)
);

-- Create tb_alunos table with complete data
CREATE TABLE IF NOT EXISTS public.tb_alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES public.tb_professores(id) ON DELETE CASCADE,
  escola_id INTEGER NOT NULL REFERENCES public.tb_escolas(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  telefone VARCHAR,
  cpf VARCHAR,
  data_nascimento DATE,
  endereco_cep VARCHAR,
  endereco_logradouro VARCHAR,
  endereco_numero VARCHAR,
  endereco_complemento VARCHAR,
  endereco_bairro VARCHAR,
  endereco_cidade VARCHAR,
  endereco_estado VARCHAR,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.tb_professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_alunos ENABLE ROW LEVEL SECURITY;

-- RLS policies for tb_escolas (admin only)
CREATE POLICY "Admins can manage escolas" 
ON public.tb_escolas 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for tb_professores
CREATE POLICY "Admins can manage professores" 
ON public.tb_professores 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professores can view own data" 
ON public.tb_professores 
FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Professores can update own data" 
ON public.tb_professores 
FOR UPDATE 
USING (auth_user_id = auth.uid());

-- RLS policies for tb_alunos
CREATE POLICY "Admins can manage alunos" 
ON public.tb_alunos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professores can view their alunos" 
ON public.tb_alunos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tb_professores 
    WHERE tb_professores.id = tb_alunos.professor_id 
    AND tb_professores.auth_user_id = auth.uid()
  )
);

-- Public read for registration links validation
CREATE POLICY "Public can read escola slugs" 
ON public.tb_escolas 
FOR SELECT 
USING (true);

CREATE POLICY "Public can read professor slugs" 
ON public.tb_professores 
FOR SELECT 
USING (true);

-- Allow public insert for student registration
CREATE POLICY "Public can register as aluno" 
ON public.tb_alunos 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professores_escola_id ON public.tb_professores(escola_id);
CREATE INDEX IF NOT EXISTS idx_professores_slug ON public.tb_professores(slug);
CREATE INDEX IF NOT EXISTS idx_alunos_professor_id ON public.tb_alunos(professor_id);
CREATE INDEX IF NOT EXISTS idx_alunos_escola_id ON public.tb_alunos(escola_id);
CREATE INDEX IF NOT EXISTS idx_escolas_slug ON public.tb_escolas(slug);

-- Trigger for updated_at on professores
CREATE TRIGGER update_professores_updated_at
BEFORE UPDATE ON public.tb_professores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on alunos
CREATE TRIGGER update_alunos_updated_at
BEFORE UPDATE ON public.tb_alunos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for school logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('escolas', 'escolas', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for escola logos
CREATE POLICY "Anyone can view escola logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'escolas');

CREATE POLICY "Admins can upload escola logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'escolas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update escola logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'escolas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete escola logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'escolas' AND has_role(auth.uid(), 'admin'::app_role));