"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export type Resultado = { ok: true; precio: number } | { ok: false; error: string };

/**
 * Actualiza el precio de un producto.
 * Corre solo en el servidor: la service_role nunca sale de aca.
 */
export async function actualizarPrecio(
  id: number,
  precioRaw: string
): Promise<Resultado> {
  // Aceptamos "1.690", "1690", "1690,50" -> normalizamos a numero
  const limpio = precioRaw.trim().replace(/\./g, "").replace(",", ".");
  const precio = Number(limpio);

  if (!Number.isFinite(precio)) {
    return { ok: false, error: "El precio no es un numero valido" };
  }
  if (precio < 0) {
    return { ok: false, error: "El precio no puede ser negativo" };
  }
  if (precio > 10_000_000) {
    return { ok: false, error: "Ese precio parece un error de tipeo" };
  }

  const { error } = await getSupabase()
    .from("verduleria_productos")
    .update({ precio, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, precio };
}

/** Marca un producto como disponible o agotado. */
export async function cambiarDisponible(
  id: number,
  disponible: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabase()
    .from("verduleria_productos")
    .update({ disponible, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}
