# Catálogo Verdulería

Panel web para ver y editar los precios del catálogo que usa el agente de WhatsApp.

Lee y escribe directo sobre la tabla `verduleria_productos` de Supabase. Lo que se
edita acá es exactamente lo que el agente consulta con la herramienta
`consultar_precios`, así que un cambio de precio impacta en la próxima cotización.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (`@supabase/supabase-js`)
- Sin librerías de UI: CSS propio, con modo claro y oscuro automático

## Cómo funciona el acceso a datos

La tabla `verduleria_productos` tiene **RLS habilitado y sin policies**. Eso
significa que la `anon key` no puede leer ni escribir: es a propósito.

Toda la lectura pasa por un Server Component y toda la escritura por Server
Actions, usando la `service_role`. **Esa clave nunca llega al browser.** Por eso
`lib/supabase.ts` no debe importarse nunca desde un archivo con `"use client"`.

## Variables de entorno

Creá un `.env.local` para desarrollo (y cargá las mismas tres en Vercel):

| Variable | Qué es |
|---|---|
| `SUPABASE_URL` | `https://oviuvzryixvjottkjnoc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | La service_role del proyecto. Supabase → Settings → API → `service_role` |
| `N8N_CONTROL_URL` | Opcional. Webhook de control de chats. Default: `https://goflip.lat/webhook/control-bot` |

**Ninguna lleva el prefijo `NEXT_PUBLIC_`**, y no hay que agregárselo: ese prefijo
las expondría en el browser.

## Correr local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

## Deploy en Vercel

```bash
npm i -g vercel     # si no lo tenés
vercel              # primer deploy (preview)
vercel --prod       # producción
```

En el panel de Vercel → Settings → Environment Variables, cargá las tres
variables de arriba para **Production** y **Preview**. Sin ellas la app no
levanta: `lib/supabase.ts` tira un error explícito al arrancar.

## Qué se puede hacer

### `/` — Catálogo

- Ver el catálogo completo, ordenado por categoría
- Buscar por nombre
- Cambiar entre lista **minorista** y **mayorista** (la mayorista todavía está vacía)
- Editar el precio de un producto (Enter o botón *Guardar*)
- Marcar un producto como **Agotado** / **Disponible** — el agente deja de ofrecerlo

### `/chats` — Control de chats

Activar o desactivar el bot por cliente.

- **Listado** de todos los chats donde el bot está desactivado, con el motivo
  (lo tomó una persona / se desactivó desde el panel / reclamo) y desde cuándo
- **Ver estado** de un teléfono puntual
- **Activar / Desactivar** el bot en un chat

Esta pantalla **no habla con Supabase**: el estado del takeover vive en Redis,
dentro de la red de EasyPanel, inalcanzable desde Vercel. El puente es un webhook
de n8n (`Field - Verduleria: Control de Chats`, path `/webhook/control-bot`) que
acepta `{accion: bloquear|reactivar|estado|listar, telefono, motivo?}`.

Las llamadas salen desde Server Actions, así que la URL del webhook nunca queda
expuesta en el browser y no hay problemas de CORS.

El input de precio acepta `1690`, `1.690` y `1690,50`: normaliza puntos de miles y
coma decimal antes de guardar. Rechaza negativos, texto y valores mayores a
10.000.000 (para atajar un cero de más al tipear).


## Estructura

```
app/
  layout.tsx          layout raíz
  page.tsx            Server Component: lee el catálogo
  actions.ts          Server Actions: actualizarPrecio, cambiarDisponible
  globals.css         estilos (claro/oscuro)
components/
  CatalogoTable.tsx   tabla editable (client component)
lib/
  supabase.ts         cliente service_role — SERVER ONLY
```
