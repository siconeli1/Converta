"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Brand } from "@/components/layout/brand";
import { Uploader } from "@/components/conversion/uploader";
import { History } from "@/components/dashboard/history";
import type { ConversionQuotaStatus } from "@/types/quota";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState({ total: 0, completed: 0 });
  const [quota, setQuota] = useState<ConversionQuotaStatus | null>(null);
  const handleCounts = useCallback((total: number, completed: number) => setCounts({ total, completed }), []);
  const handleQuota = useCallback((nextQuota: ConversionQuotaStatus | null) => setQuota(nextQuota), []);
  const quotaReset = quota
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(quota.resetAt))
    : "";

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, router, user]);
  if (loading || !user) return <main className="auth-page"><p>Carregando sua conta...</p></main>;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="shell dash-header-inner">
          <Brand />
          <div className="account">
            <span className="avatar" aria-hidden="true" style={{ display: "grid", placeItems: "center", fontWeight: 800, color: "#2457d6" }}>
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </span>
            <span>{user.displayName || user.email}</span>
            <button className="icon-button" title="Sair" aria-label="Sair" onClick={async () => { await logout(); router.push("/"); }}><LogOut size={17} /></button>
          </div>
        </div>
      </header>
      <main className="shell dash-main">
        <div className="dash-title"><div><h1>Olá, {user.displayName?.split(" ")[0] || "estudante"}.</h1><p>Qual documento vamos preparar hoje?</p></div></div>
        <div className="dashboard-grid">
          <Uploader onQuotaChange={handleQuota} />
          <aside className="panel">
            <div className="panel-head"><h2>Resumo</h2></div>
            <div className="quota-summary" aria-live="polite">
              <div>
                <span>Disponíveis hoje</span>
                <strong>{quota ? quota.remaining : "–"}</strong>
              </div>
              <div className="quota-meter" aria-hidden="true">
                <span style={{ width: `${quota ? (quota.globalRemaining / quota.globalLimit) * 100 : 0}%` }} />
              </div>
              <p>
                {quota
                  ? `${quota.globalRemaining} no serviço e ${quota.userRemaining} para sua conta. Renova em ${quotaReset}.`
                  : "Consultando a disponibilidade do serviço."}
              </p>
            </div>
            <div className="stat-list"><div className="stat"><span>Conversões recentes</span><strong>{counts.total}</strong></div><div className="stat"><span>Concluídas</span><strong>{counts.completed}</strong></div><div className="stat"><span>Formatos</span><strong>2</strong></div></div>
            <div className="privacy-note"><strong>Seus arquivos são privados.</strong><br />Exclua quando quiser. A limpeza automática é programada após sete dias.</div>
          </aside>
        </div>
        <History onCounts={handleCounts} />
      </main>
    </div>
  );
}
