

## Plan: Image Import for Products + Public Catalog Module

### What will be built

**1. Product Image Import (via XLSX + ZIP)**
- User uploads a ZIP file containing product images and an XLSX mapping file
- The XLSX has two columns: `codigo` (product code) and `imagem` (image filename inside the ZIP)
- The system matches each image to an existing product by `codigo`, uploads the image to the `produtos` storage bucket, and updates `imagem_url` on `tb_produtos`
- New component: `ImportImagensProdutosDialog` accessible from the Products page

**2. Public Catalog Module**
- A new public route `/catalogo/:dominio` (no authentication required)
- Displays products with: name, sale price, available stock quantity, and photo
- Filters only active products (`ativo = true`) with stock > 0
- Responsive grid layout, similar to the public scheduling page pattern
- A link to the catalog will be available in the sidebar/settings for the user to copy and share

---

### Technical Details

**Files to create:**
- `src/components/ImportImagensProdutosDialog.tsx` — Dialog with two inputs: ZIP of images + XLSX mapping (codigo → image filename). Parses XLSX, extracts images from ZIP (using JSZip), matches by codigo, uploads to `produtos` bucket, updates `tb_produtos.imagem_url`
- `src/pages/CatalogoPublico.tsx` — Public page that fetches products + stock for a given domain via an edge function (since RLS requires auth)
- `supabase/functions/catalogo-publico/index.ts` — Edge function that receives `dominio` as param and returns active products with stock info (joins `tb_produtos` + `tb_estq_unidades`), no auth required

**Files to modify:**
- `src/pages/Produtos.tsx` — Add "IMPORTAR IMAGENS" button
- `src/App.tsx` — Add `/catalogo/:dominio` public route
- `src/components/AppSidebar.tsx` — Add "Catálogo" menu item with copy-link functionality
- `package.json` — Add `jszip` dependency for ZIP extraction

**Database changes:**
- None required. `tb_produtos.imagem_url` already exists. Storage bucket `produtos` already exists and is public.

**Edge function `catalogo-publico`:**
- Accepts `dominio` query param
- Uses service role to query `tb_produtos` (active, with stock) joined with `tb_estq_unidades`
- Returns: `id`, `nome`, `preco_venda`, `imagem_url`, `quantidade` (stock)
- No JWT verification needed

**Image import flow:**
1. User downloads XLSX template with columns: `codigo`, `imagem`
2. User fills in mapping (e.g., `BRA26AZUL` → `camisa_brasil.jpg`)
3. User uploads the XLSX + a ZIP containing the image files
4. System reads XLSX, extracts matching images from ZIP
5. For each match: uploads image to `produtos/{dominio}/{codigo}.ext` in storage
6. Updates `tb_produtos.imagem_url` for each matched product
7. Shows summary of successful/failed uploads

**Public catalog page:**
- Clean, responsive product grid with cards
- Each card shows: product image (or placeholder), name, price formatted as BRL, stock quantity
- Search/filter by name
- Domain branding from `tb_clientes_saas.razao_social`

