/**
 * Cliente del webhook de control de chats en n8n.
 *
 * SERVER ONLY. El estado del takeover vive en Redis, dentro de la red de
 * EasyPanel, así que no es accesible desde Vercel: n8n hace de puente.
 * Nunca importar desde un componente "use client".
 */
const URL_CONTROL =
  process.env.N8N_CONTROL_URL ?? "https://goflip.lat/webhook/control-bot";

export type Chat = {
  telefono: string;
  bot_activo: boolean;
  por?: string | null;
  motivo?: string | null;
  desde?: string | null;
};

async function llamar(body: Record<string, unknown>) {
  const res = await fetch(URL_CONTROL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`n8n respondió ${res.status}`);
  }
  const texto = await res.text();
  if (!texto.trim()) return [];
  try {
    const data = JSON.parse(texto);
    return Array.isArray(data) ? data : [data];
  } catch {
    throw new Error("n8n devolvió una respuesta que no es JSON");
  }
}

/** Lista los chats con el bot desactivado. */
export async function listarBloqueados(): Promise<Chat[]> {
  const filas = await llamar({ accion: "listar" });
  return filas
    .filter((f: Record<string, unknown>) => !f.vacio && f.telefono)
    .map((f: Record<string, unknown>) => ({
      telefono: String(f.telefono),
      bot_activo: false,
      por: (f.por as string) ?? null,
      motivo: (f.motivo as string) ?? null,
      desde: (f.desde as string) ?? null,
    }));
}

/** Consulta si el bot está activo en un chat. */
export async function estadoDe(telefono: string): Promise<Chat> {
  const [f] = await llamar({ accion: "estado", telefono });
  let detalle: Record<string, unknown> = {};
  try {
    detalle = f?.detalle ? JSON.parse(f.detalle) : {};
  } catch {
    detalle = {};
  }
  return {
    telefono: String(f?.telefono ?? telefono),
    bot_activo: Boolean(f?.bot_activo),
    por: (detalle.por as string) ?? null,
    motivo: (detalle.motivo as string) ?? null,
    desde: (detalle.desde as string) ?? null,
  };
}

/** Activa o desactiva el bot en un chat. */
export async function setBot(telefono: string, activar: boolean) {
  const [f] = await llamar({
    accion: activar ? "reactivar" : "bloquear",
    telefono,
    motivo: activar ? undefined : "panel",
  });
  return { ok: Boolean(f?.ok), mensaje: String(f?.mensaje ?? "") };
}
