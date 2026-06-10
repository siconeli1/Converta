"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error", error);
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        path: window.location.pathname,
      }),
    });
  }, [error]);

  return (
    <main className="error-page">
      <div className="error-panel">
        <span className="error-page-icon"><AlertTriangle size={25} /></span>
        <span className="eyebrow">Algo não saiu como esperado</span>
        <h1>Não foi possível carregar esta parte do Converta.</h1>
        <p>O erro foi registrado para diagnóstico. Você pode tentar novamente sem perder sua conta ou histórico.</p>
        <button className="button button-primary" onClick={reset}>
          <RefreshCw size={18} /> Tentar novamente
        </button>
      </div>
    </main>
  );
}
