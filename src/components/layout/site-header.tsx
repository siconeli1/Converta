import Link from "next/link";
import { Brand } from "@/components/layout/brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav">
        <Brand />
        <nav className="nav-links" aria-label="Principal">
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/privacy">Privacidade</Link>
          <Link className="button button-primary" href="/login">Entrar</Link>
        </nav>
      </div>
    </header>
  );
}
