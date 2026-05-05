-- Backfill cartaxoimports
UPDATE public.tb_produtos
SET codigo = 'CTX-' || id::text
WHERE dominio = 'cartaxoimports'
  AND (codigo IS NULL OR codigo = '');

-- Deduplicate existing duplicates across all domains (keep first by id, suffix others)
WITH dups AS (
  SELECT id, codigo,
         ROW_NUMBER() OVER (PARTITION BY dominio, codigo ORDER BY id) AS rn
  FROM public.tb_produtos
  WHERE codigo IS NOT NULL AND codigo <> ''
)
UPDATE public.tb_produtos p
SET codigo = p.codigo || '-' || p.id::text
FROM dups
WHERE p.id = dups.id AND dups.rn > 1;

-- Unique index per domain (allows NULL/empty)
CREATE UNIQUE INDEX IF NOT EXISTS tb_produtos_dominio_codigo_unique
ON public.tb_produtos (dominio, codigo)
WHERE codigo IS NOT NULL AND codigo <> '';