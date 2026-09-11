import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase — SERVER ONLY.
 *
 * Funciona sin configuracion: la anon key de Supabase es publica por diseno
 * (va en apps cliente), y la tabla verduleria_productos tiene policies de RLS
 * que permiten SELECT y UPDATE con ese rol. No hay INSERT ni DELETE, asi que
 * nadie puede agregar productos falsos ni vaciar el catalogo.
 *
 * Las tablas con datos de clientes (verduleria_pedidos, verduleria_chats) NO
 * tienen policy: son inaccesibles con la anon key.
 *
 * Si defines SUPABASE_SERVICE_ROLE_KEY, se usa esa en lugar de la anon.
 */
const URL_DEFECTO = "https://coawoqhwfbkgjblhuwql.supabase.co";
const ANON_DEFECTO =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvYXdvcWh3ZmJrZ2pibGh1d3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5OTYzNTksImV4cCI6MjEwNDU3MjM1OX0.yQGiYHUV-Hc0Eup_6vxwPomyw_CK3pFdm---_2cnWqo";

let cliente: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.SUPABASE_URL || URL_DEFECTO;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ANON_DEFECTO;

  cliente = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cliente;
}

export type Producto = {
  id: number;
  producto: string;
  categoria: string;
  unidad: string;
  precio: number;
  precio_mayorista: number | null;
  disponible: boolean;
  lista: "minorista" | "mayorista";
  actualizado_en: string;
  descripcion: string | null;
};
