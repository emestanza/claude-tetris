import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "96px 16px" }}>
      <div className="pixel neon-magenta flicker" style={{ fontSize: 48 }}>404</div>
      <div className="pixel neon-cyan" style={{ fontSize: 14, marginTop: 20 }}>
        JUEGO NO ENCONTRADO
      </div>
      <p className="mono" style={{ color: "var(--ink-dim)", fontSize: 12, letterSpacing: "0.12em", margin: "16px 0 32px" }}>
        ESTE CARTUCHO NO EXISTE EN EL VAULT
      </p>
      <Link href="/" className="btn lg">VOLVER AL VAULT</Link>
    </div>
  );
}
