import { supabase } from "@/integrations/supabase/client";

export interface SyncProductPayload {
  codigo?: string | null;
  nome?: string | null;
  preco?: number | null;
  preco_compra?: number | null;
  estoque?: number | null;
  categoria?: string | null;
  imagem?: string | null;
  codigo_barras?: string | null;
  action?: "delete";
}

/**
 * Fire-and-forget sync of products to all active "enviar_produtos" integrations
 * configured for the current domain/unit.
 */
export function syncProductsToSite(
  dominio: string,
  unidadeId: number | null,
  produtos: SyncProductPayload[],
  action: "upsert" | "delete" = "upsert",
) {
  try {
    if (!dominio || !produtos || produtos.length === 0) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "dymdchhxabwaxownoxtz";
    void supabase.auth.getSession().then(({ data }) => {
      void fetch(`https://${projectId}.supabase.co/functions/v1/sync-products-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data?.session?.access_token || ""}`,
        },
        body: JSON.stringify({ dominio, unidade_id: unidadeId, produtos, action }),
      }).catch((err) => console.warn("[syncProductsToSite] failed:", err));
    });
  } catch (err) {
    console.warn("[syncProductsToSite] error:", err);
  }
}