"use client";

import { useState } from "react";
import { crearProducto } from "@/app/actions";

type Estado = { tipo: "ok" | "err"; texto: string } | null;

const VACIO = { producto: "", categoria: "", unidad: "", precio: "", precioMayorista: "", descripcion: "" };

export default function AgregarProducto({ categorias, unidades }: { categorias: string[]; unidades: string[] }) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState<Estado>(null);

  async function guardar() {
    setGuardando(true);
    setEstado(null);
    const res = await crearProducto(datos);
    setGuardando(false);

    if (res.ok) {
      setEstado({ tipo: "ok", texto: `"${datos.producto}" agregado al catalogo.` });
      setDatos(VACIO);
    } else {
      setEstado({ tipo: "err", texto: res.error });
    }
  }

  if (!abierto) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn" onClick={() => setAbierto(true)}>
          + Agregar producto
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div className="toolbar" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <input
          className="search"
          type="text"
          placeholder="Nombre (ej: Canasta Familiar)"
          value={datos.producto}
          onChange={(e) => setDatos((d) => ({ ...d, producto: e.target.value }))}
        />
        <input
          className="search"
          list="categorias-existentes"
          type="text"
          placeholder="Categoria (ej: combo)"
          value={datos.categoria}
          onChange={(e) => setDatos((d) => ({ ...d, categoria: e.target.value }))}
        />
        <input
          className="search"
          list="unidades-existentes"
          type="text"
          placeholder="Unidad (ej: canasta)"
          value={datos.unidad}
          onChange={(e) => setDatos((d) => ({ ...d, unidad: e.target.value }))}
        />
        <input
          className="precio-input"
          type="text"
          inputMode="decimal"
          placeholder="Precio minorista"
          value={datos.precio}
          onChange={(e) => setDatos((d) => ({ ...d, precio: e.target.value }))}
        />
        <input
          className="precio-input"
          type="text"
          inputMode="decimal"
          placeholder="Precio mayorista (opcional)"
          value={datos.precioMayorista}
          onChange={(e) => setDatos((d) => ({ ...d, precioMayorista: e.target.value }))}
        />
        <textarea
          className="descripcion-input"
          placeholder="Contenido (opcional, ej: 1kg tomate, 1kg papa, 1 lechuga...)"
          rows={2}
          value={datos.descripcion}
          onChange={(e) => setDatos((d) => ({ ...d, descripcion: e.target.value }))}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={guardando || !datos.producto.trim() || !datos.categoria.trim() || !datos.unidad.trim() || !datos.precio.trim()}
          onClick={guardar}
        >
          {guardando ? "..." : "Guardar producto"}
        </button>
        <button type="button" className="btn" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>

      <datalist id="categorias-existentes">
        {categorias.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="unidades-existentes">
        {unidades.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="estado-msg">
        {estado && (
          <span className={estado.tipo === "ok" ? "ok" : "err"}>{estado.texto}</span>
        )}
      </div>
    </div>
  );
}
