"use client";

import { useMemo, useState, useTransition } from "react";
import { actualizarPrecio, cambiarDisponible } from "@/app/actions";
import type { Producto } from "@/lib/supabase";

const clp = new Intl.NumberFormat("es-CL");

type Estado = { tipo: "ok" | "err"; texto: string } | null;

export default function CatalogoTable({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [lista, setLista] = useState<"minorista" | "mayorista">("minorista");
  const [borradores, setBorradores] = useState<Record<number, string>>({});
  const [estado, setEstado] = useState<Estado>(null);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const listasDisponibles = useMemo(() => {
    const s = new Set(productos.map((p) => p.lista));
    return { minorista: s.has("minorista"), mayorista: s.has("mayorista") };
  }, [productos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => p.lista === lista)
      .filter((p) => (q ? p.producto.toLowerCase().includes(q) : true));
  }, [productos, busqueda, lista]);

  function valorDe(p: Producto) {
    return borradores[p.id] ?? String(p.precio);
  }

  function cambio(p: Producto) {
    const actual = valorDe(p).trim().replace(/\./g, "").replace(",", ".");
    return Number(actual) !== Number(p.precio);
  }

  async function guardar(p: Producto) {
    setGuardandoId(p.id);
    setEstado(null);
    const res = await actualizarPrecio(p.id, valorDe(p));
    setGuardandoId(null);

    if (res.ok) {
      setBorradores((b) => {
        const { [p.id]: _drop, ...resto } = b;
        return resto;
      });
      setEstado({
        tipo: "ok",
        texto: `${p.producto}: precio actualizado a $${clp.format(res.precio)}`,
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

  return (
    <>
      {!listasDisponibles.mayorista && lista === "mayorista" && (
        <div className="aviso">
          Todavia no hay productos cargados en la lista mayorista.
        </div>
      )}

      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="tabs">
          <button
            type="button"
            data-on={lista === "minorista" ? "1" : "0"}
            onClick={() => setLista("minorista")}
          >
            Minorista
          </button>
          <button
            type="button"
            data-on={lista === "mayorista" ? "1" : "0"}
            onClick={() => setLista("mayorista")}
          >
            Mayorista
          </button>
        </div>
      </div>

      <div className="card">
        <div className="scroller">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio (CLP)</th>
                <th></th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const editado = cambio(p);
                return (
                  <tr key={p.id} data-off={p.disponible ? "0" : "1"}>
                    <td>
                      <div className="nombre">{p.producto}</div>
                      <div className="meta">
                        {p.categoria} &middot; por {p.unidad}
                      </div>
                    </td>
                    <td className="col-precio">
                      <span className="peso">$</span>
                      <input
                        className="precio-input"
                        type="text"
                        inputMode="decimal"
                        value={valorDe(p)}
                        onChange={(e) =>
                          setBorradores((b) => ({ ...b, [p.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editado) guardar(p);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!editado || guardandoId === p.id}
                        onClick={() => guardar(p)}
                      >
                        {guardandoId === p.id ? "..." : "Guardar"}
                      </button>
                    </td>
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
                );
              })}
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
