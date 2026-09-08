"use server";

import { revalidatePath } from "next/cache";
import { estadoDe, setBot, type Chat } from "@/lib/n8n";

function normalizar(tel: string) {
  const digitos = tel.replace(/[^0-9]/g, "");
  return digitos ? "+" + digitos : "";
}

export type AccionResultado =
  | { ok: true; mensaje: string; chat?: Chat }
  | { ok: false; error: string };

/** Activa o desactiva el bot para un teléfono. */
export async function cambiarBot(
  telefonoRaw: string,
  activar: boolean
): Promise<AccionResultado> {
  const telefono = normalizar(telefonoRaw);
  if (telefono.replace("+", "").length < 8) {
    return { ok: false, error: "El teléfono es demasiado corto" };
  }
  try {
    const r = await setBot(telefono, activar);
    revalidatePath("/chats");
    return { ok: true, mensaje: r.mensaje };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Consulta el estado del bot en un chat puntual. */
export async function consultarEstado(
  telefonoRaw: string
): Promise<AccionResultado> {
  const telefono = normalizar(telefonoRaw);
  if (telefono.replace("+", "").length < 8) {
    return { ok: false, error: "El teléfono es demasiado corto" };
  }
  try {
    const chat = await estadoDe(telefono);
    return {
      ok: true,
      mensaje: chat.bot_activo
        ? `El bot está ACTIVO en ${chat.telefono}`
        : `El bot está DESACTIVADO en ${chat.telefono}`,
      chat,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
