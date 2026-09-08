import { listarBloqueados, type Chat } from "@/lib/n8n";
import ChatsPanel from "@/components/ChatsPanel";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  let bloqueados: Chat[] = [];
  let error: string | null = null;

  try {
    bloqueados = await listarBloqueados();
  } catch (e) {
    error = e instanceof Error ? e.message : "No se pudo consultar n8n";
  }

  return (
    <main className="wrap">
      <Nav actual="chats" />
      <header className="top">
        <h1>Control de chats</h1>
        <p>
          Acá activás o desactivás el bot por cliente. Cuando está desactivado,
          el agente no responde en ese chat y lo atiende una persona.
        </p>
      </header>

      {error && (
        <div className="aviso">
          No se pudo consultar el estado en n8n: {error}
        </div>
      )}

      <ChatsPanel bloqueados={bloqueados} />
    </main>
  );
}
