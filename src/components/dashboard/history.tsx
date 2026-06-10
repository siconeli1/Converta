"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Trash2 } from "lucide-react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";
import { formatBytes } from "@/lib/utils";
import type { ConversionDocument, ConversionStatus } from "@/types/conversion";

const labels: Record<ConversionStatus, string> = {
  uploading: "Enviando", queued: "Na fila", processing: "Processando", completed: "Concluído", failed: "Falhou", expired: "Expirado",
};

export function History({ onCounts }: { onCounts?: (total: number, completed: number) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ConversionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  useEffect(() => {
    if (!user) return;
    const { db } = getFirebaseClient();
    const conversions = query(collection(db, "conversions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(conversions, (snapshot) => {
      const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ConversionDocument[];
      setItems(next);
      setLoading(false);
      onCounts?.(next.length, next.filter((item) => item.status === "completed").length);
    }, () => setLoading(false));
  }, [onCounts, user]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }), []);
  async function authorizedFetch(url: string, options?: RequestInit) {
    if (!user) return null;
    const token = await user.getIdToken();
    return fetch(url, { ...options, headers: { ...options?.headers, Authorization: `Bearer ${token}` } });
  }
  async function download(id: string) {
    setActionId(id);
    const response = await authorizedFetch(`/api/conversions/${id}/download`);
    if (response?.ok) {
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      const fileName = disposition?.match(/filename="([^"]+)"/)?.[1];
      link.href = url;
      link.download = fileName || "arquivo-convertido";
      link.click();
      URL.revokeObjectURL(url);
    }
    setActionId("");
  }
  async function retry(id: string) {
    setActionId(id);
    await authorizedFetch(`/api/conversions/${id}/process`, { method: "POST" });
    setActionId("");
  }
  async function remove(id: string) {
    if (!window.confirm("Excluir esta conversão e seus arquivos?")) return;
    setActionId(id);
    await authorizedFetch(`/api/conversions/${id}`, { method: "DELETE" });
    setActionId("");
  }

  return (
    <section className="panel history">
      <div className="panel-head"><h2>Conversões recentes</h2></div>
      {loading ? <><div className="skeleton" /><div className="skeleton" /></> : items.length === 0 ? (
        <div className="empty"><FileText size={34} /><div><strong>Nenhuma conversão ainda</strong><p>Seu primeiro arquivo aparecerá aqui.</p></div></div>
      ) : (
        <ul className="history-list">
          {items.map((item) => {
            const timestamp = item.createdAt as { toDate?: () => Date };
            return (
              <li className="history-item" key={item.id}>
                <div><div className="file-name">{item.originalName}</div><div className="file-meta">{item.originalExtension.toUpperCase()} → {item.outputExtension.toUpperCase()} · {formatBytes(item.originalSize)}</div>{item.errorMessage && <div className="error-text">{item.errorMessage}</div>}</div>
                <div className={`status status-${item.status}`}><span className="status-dot" />{labels[item.status]}</div>
                <div className="file-meta">{timestamp?.toDate ? dateFormatter.format(timestamp.toDate()) : "Agora"}</div>
                <div className="item-actions">
                  {item.status === "completed" && <button className="icon-button" title="Baixar" aria-label={`Baixar ${item.originalName}`} disabled={actionId === item.id} onClick={() => download(item.id)}><Download size={17} /></button>}
                  {item.status === "failed" && <button className="icon-button" title="Tentar novamente" aria-label={`Tentar ${item.originalName} novamente`} disabled={actionId === item.id} onClick={() => retry(item.id)}><RefreshCw size={17} /></button>}
                  <button className="icon-button" title="Excluir" aria-label={`Excluir ${item.originalName}`} disabled={actionId === item.id || item.status === "processing"} onClick={() => remove(item.id)}><Trash2 size={17} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
