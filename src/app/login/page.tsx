"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { LockKeyhole } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { SiteHeader } from "@/components/layout/site-header";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const { login, loading, configured } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setError("");
    setSubmitting(true);
    try {
      await login();
      router.push("/dashboard");
    } catch (loginError) {
      console.error("Google sign-in failed", loginError);

      if (loginError instanceof FirebaseError) {
        const messages: Record<string, string> = {
          "auth/operation-not-allowed": "O login com Google ainda não está ativado no Firebase.",
          "auth/unauthorized-domain": "Este domínio ainda não está autorizado no Firebase Authentication.",
          "auth/invalid-api-key": "A chave pública do Firebase está inválida.",
          "auth/popup-blocked": "O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.",
          "auth/popup-closed-by-user": "A janela de login foi fechada antes da conclusão.",
          "auth/cancelled-popup-request": "Outra tentativa de login já estava aberta. Tente novamente.",
        };

        setError(`${messages[loginError.code] ?? "Não foi possível entrar com o Google."} (${loginError.code})`);
      } else {
        setError("Não foi possível entrar com o Google. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-panel">
          <Brand />
          <h1>Entre e comece a converter.</h1>
          <p>Seu histórico e seus arquivos ficam vinculados à sua conta. Usamos o Google somente para autenticação.</p>
          <button className="button button-primary google-button" onClick={handleLogin} disabled={loading || submitting || !configured}>
            <span aria-hidden="true">G</span>{submitting ? "Entrando..." : "Continuar com Google"}
          </button>
          {!configured && <div className="notice">O Firebase ainda não está configurado. Preencha as variáveis do arquivo <code>.env.local</code> para habilitar o login.</div>}
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="notice"><LockKeyhole size={16} aria-hidden="true" /> Arquivos são privados e programados para expirar após 7 dias.</div>
        </section>
      </main>
    </>
  );
}
