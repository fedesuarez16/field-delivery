import { getSupabase, type Producto } from "@/lib/supabase";
import CatalogoTable from "@/components/CatalogoTable";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { data, error } = await getSupabase()
    .from("verduleria_productos")
    .select(
      "id, producto, categoria, unidad, precio, precio_mayorista, disponible, lista, actualizado_en"
    )
    .order("categoria", { ascending: true })
    .order("producto", { ascending: true });

  if (error) {
    return (
      <main className="wrap">
        <Nav actual="catalogo" />
        <header className="top">
          <h1>Catalogo Verduleria</h1>
        </header>
        <div className="card">
          <p className="vacio">
            No se pudo leer el catalogo: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const productos = (data ?? []) as Producto[];

  return (
    <main className="wrap">
      <Nav actual="catalogo" />
      <header className="top">
        <h1>Catalogo Verduleria</h1>
        <p>
          {productos.length} productos. Los precios que edites aca son los que
          usa el agente de WhatsApp para cotizar.
        </p>
      </header>
      <CatalogoTable productos={productos} />
    </main>
  );
}
