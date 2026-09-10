"use client";

import { useMemo, useState, useTransition } from "react";
import {
  actualizarPrecio,
  actualizarPrecioMayorista,
  cambiarDisponible,
} from "@/app/actions";
import type { Producto } from "@/lib/supabase";

const clp = new Intl.NumberFormat("es-CL");

type Estado = { tipo: "ok" | "err"; texto: string } | null;
type Columna = "minorista" | "mayorista";

export default function CatalogoTable({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<Estado>(null);
  const [guardandoKey, setGuardandoKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) =>
      q ? p.producto.toLowerCase().includes(q) : true
    );
  }, [productos, busqueda]);

  function clave(id: number, columna: Columna) {
    return `${id}:${columna}`;
  }

  function valorBase(p: Producto, columna: Columna) {
    const base = columna === "minorista" ? p.precio : p.precio_mayorista;
    return base === null || base === undefined ? "" : String(base);
  }

  function valorDe(p: Producto, columna: Columna) {
    const k = clave(p.id, columna);
    return borradores[k] ?? valorBase(p, columna);
  }

  function cambio(p: Producto, columna: Columna) {
    const actual = valorDe(p, columna).trim().replace(/\./g, "").replace(",", ".");
    const original = valorBase(p, columna).trim().replace(/\./g, "").replace(",", ".");
    if (actual === "" && original === "") return false;
    return Number(actual) !== Number(original || 0);
  }

  async function guardar(p: Producto, columna: Columna) {
    const k = clave(p.id, columna);
    setGuardandoKey(k);
    setEstado(null);

    const accion = columna === "minorista" ? actualizarPrecio : actualizarPrecioMayorista;
    const res = await accion(p.id, valorDe(p, columna));
    setGuardandoKey(null);

    if (res.ok) {
      setBorradores((b) => {
        const { [k]: _drop, ...resto } = b;
        return resto;
      });
      const etiqueta = columna === "minorista" ? "minorista" : "mayorista";
      setEstado({
        tipo: "ok",
        texto: `${p.producto}: precio ${etiqueta} actualizado a $${clp.format(res.precio)}`,
      });
    } else {
      setEstado({ tipo: "err", texto: `${p.producto}: ${res.error}` });
    }
  }

  function alternarDisponible(p: Producto) {
    startTransition(async () => {
      const res = await cambiarDisponible(p.id, !p.disponible);
      if (!res.ok) {
        setEstado({ tipo: "err", texto: `${p.producto}: ${res.error}` });
      } else {
        setEstado({
          tipo: "ok",
          texto: `${p.producto}: ${!p.disponible ? "disponible" : "marcado como agotado"}`,
        });
      }
    });
  }

  function celdaPrecio(p: Producto, columna: Columna) {
    const editado = cambio(p, columna);
    const k = clave(p.id, columna);
    return (
      <td className="col-precio">
        <span className="peso">$</span>
        <input
          className="precio-input"
          type="text"
          inputMode="decimal"
          placeholder={columna === "mayorista" ? "sin cargar" : undefined}
          value={valorDe(p, columna)}
          onChange={(e) =>
            setBorradores((b) => ({ ...b, [k]: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && editado) guardar(p, columna);
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={!editado || guardandoKey === k}
          onClick={() => guardar(p, columna)}
        >
          {guardandoKey === k ? "..." : "Guardar"}
        </button>
      </td>
    );
  }

  return (
    <>
      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="scroller">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio minorista (CLP)</th>
                <th>Precio mayorista (CLP)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id} data-off={p.disponible ? "0" : "1"}>
                  <td>
                    <div className="nombre">{p.producto}</div>
                    <div className="meta">
                      {p.categoria} &middot; por {p.unidad}
                    </div>
                  </td>
                  {celdaPrecio(p, "minorista")}
                  {celdaPrecio(p, "mayorista")}
                  <td className="col-estado">
                    <button
                      type="button"
                      className="chip"
                      data-on={p.disponible ? "1" : "0"}
                      onClick={() => alternarDisponible(p)}
                    >
                      {p.disponible ? "Disponible" : "Agotado"}
                    </button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={4} className="vacio">
                    No hay productos que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="estado-msg">
        {estado && (
          <span className={estado.tipo === "ok" ? "ok" : "err"}>
            {estado.texto}
          </span>
        )}
      </div>
    </>
  );
}
