"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export type Resultado = { ok: true; precio: number } | { ok: false; error: string };

type ColumnaPrecio = "precio" | "precio_mayorista";

function normalizarPrecio(precioRaw: string): Resultado | number {
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
  return precio;
}

async function guardarPrecio(
  id: number,
  columna: ColumnaPrecio,
  precioRaw: string
): Promise<Resultado> {
  const precio = normalizarPrecio(precioRaw);
  if (typeof precio !== "number") return precio;

  const { error } = await getSupabase()
    .from("verduleria_productos")
    .update({ [columna]: precio, actualizado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, precio };
}

/**
 * Actualiza el precio minorista de un producto.
 * Corre solo en el servidor: la service_role nunca sale de aca.
 */
export async function actualizarPrecio(
  id: number,
  precioRaw: string
): Promise<Resultado> {
  return guardarPrecio(id, "precio", precioRaw);
}

/** Actualiza (o carga por primera vez) el precio mayorista de un producto. */
export async function actualizarPrecioMayorista(
  id: number,
  precioRaw: string
): Promise<Resultado> {
  return guardarPrecio(id, "precio_mayorista", precioRaw);
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
