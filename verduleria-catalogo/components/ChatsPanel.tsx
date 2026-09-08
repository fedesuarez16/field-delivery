"use client";

import { useState } from "react";
import { cambiarBot, consultarEstado } from "@/app/chats/actions";
import type { Chat } from "@/lib/n8n";

type Estado = { tipo: "ok" | "err"; texto: string } | null;

function cuando(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function origen(por?: string | null, motivo?: string | null) {
  if (por === "humano") return "lo tomó una persona desde el celular";
  if (por === "panel") return motivo ? `desde el panel (${motivo})` : "desde el panel";
  if (por === "reclamo") return "reclamo detectado por el agente";
  return por ?? "";
}

export default function ChatsPanel({ bloqueados }: { bloqueados: Chat[] }) {
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<Estado>(null);
  const [cargando, setCargando] = useState<string | null>(null);

  async function accion(tel: string, activar: boolean) {
    setCargando(tel + String(activar));
    setEstado(null);
    const r = await cambiarBot(tel, activar);
    setCargando(null);
    setEstado(
      r.ok ? { tipo: "ok", texto: r.mensaje } : { tipo: "err", texto: r.error }
    );
  }

  async function ver() {
    setCargando("ver");
    setEstado(null);
    const r = await consultarEstado(telefono);
    setCargando(null);
    if (!r.ok) {
      setEstado({ tipo: "err", texto: r.error });
      return;
    }
    const extra =
      r.chat && !r.chat.bot_activo && r.chat.por
        ? ` — ${origen(r.chat.por, r.chat.motivo)}${
            r.chat.desde ? ` el ${cuando(r.chat.desde)}` : ""
          }`
        : "";
    setEstado({ tipo: "ok", texto: r.mensaje + extra });
  }

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <input
            className="search"
            type="text"
            placeholder="+56912345678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && telefono.trim()) ver();
            }}
          />
          <button
            className="btn"
            onClick={ver}
            disabled={!telefono.trim() || cargando === "ver"}
          >
            {cargando === "ver" ? "..." : "Ver estado"}
          </button>
          <button
            className="btn"
            onClick={() => accion(telefono, false)}
            disabled={!telefono.trim() || cargando === telefono + "false"}
          >
            Desactivar bot
          </button>
          <button
            className="btn btn-primary"
            onClick={() => accion(telefono, true)}
            disabled={!telefono.trim() || cargando === telefono + "true"}
          >
            Activar bot
          </button>
        </div>
        <div className="estado-msg">
          {estado && (
            <span className={estado.tipo === "ok" ? "ok" : "err"}>
              {estado.texto}
            </span>
          )}
        </div>
      </div>

      <h2 className="subtitulo">
        Chats con el bot desactivado{" "}
        <span className="contador">{bloqueados.length}</span>
      </h2>

      <div className="card">
        <div className="scroller">
          <table>
            <thead>
              <tr>
                <th>Teléfono</th>
                <th>Motivo</th>
                <th>Desde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bloqueados.map((c) => (
                <tr key={c.telefono}>
                  <td className="nombre">{c.telefono}</td>
                  <td className="meta">{origen(c.por, c.motivo)}</td>
                  <td className="meta">{cuando(c.desde)}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => accion(c.telefono, true)}
                      disabled={cargando === c.telefono + "true"}
                    >
                      {cargando === c.telefono + "true"
                        ? "..."
                        : "Reactivar bot"}
                    </button>
                  </td>
                </tr>
              ))}
              {bloqueados.length === 0 && (
                <tr>
                  <td colSpan={4} className="vacio">
                    No hay chats desactivados. El bot está respondiendo en todos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
