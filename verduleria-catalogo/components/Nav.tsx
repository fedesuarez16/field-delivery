import Link from "next/link";

export default function Nav({ actual }: { actual: "catalogo" | "chats" }) {
  return (
    <nav className="nav">
      <Link href="/" data-on={actual === "catalogo" ? "1" : "0"}>
        Catálogo
      </Link>
      <Link href="/chats" data-on={actual === "chats" ? "1" : "0"}>
        Control de chats
      </Link>
    </nav>
  );
}
