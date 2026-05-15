
CREATE TABLE public.tb_estagios_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  areas_interesse text[] NOT NULL DEFAULT '{}',
  curriculo_url text,
  mensagem text,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tb_estagios_candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
  ON public.tb_estagios_candidatos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view applications"
  ON public.tb_estagios_candidatos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
  ON public.tb_estagios_candidatos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete applications"
  ON public.tb_estagios_candidatos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculos', 'curriculos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload curriculum"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'curriculos');

CREATE POLICY "Admins can view curriculums"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'curriculos' AND public.has_role(auth.uid(), 'admin'));
