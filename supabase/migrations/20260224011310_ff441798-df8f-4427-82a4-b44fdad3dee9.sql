ALTER TABLE public.tb_agenda_config 
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#f5f5f5',
  ADD COLUMN IF NOT EXISTS descricao_publica TEXT;