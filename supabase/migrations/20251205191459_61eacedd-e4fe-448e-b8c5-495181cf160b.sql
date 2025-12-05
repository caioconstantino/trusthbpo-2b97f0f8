-- Add unidades_acesso column to tb_usuarios (array of unit IDs the user can access)
ALTER TABLE public.tb_usuarios
ADD COLUMN IF NOT EXISTS unidades_acesso integer[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.tb_usuarios.unidades_acesso IS 'Array of unidade IDs the user has access to. NULL means access to all units.';