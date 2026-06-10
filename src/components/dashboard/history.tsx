"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";
import { formatBytes } from "@/lib/utils";
import type { ConversionDocument, ConversionStatus } from "@/types/conversion";

const labels: Record<ConversionStatus, string> = {
  uploading: "Enviando",
  queued: "Na fila",
  processing: "Processando",
  completed: "Concluído",
  failed: "Falhou",
  expired: "Expirado",
};

type ActionState = {
  id: string;
  type: "download" | "retry" | "delete";
} | null;

type Feedback = {
  tone: "success" | "error";
  message: string;
} | null;

export function History({ onCounts }: { onCounts?: (total: number, completed: number) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ConversionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActionState>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!user) return;
    const { db } = getFirebaseClient();
    const conversions = query(
      collection(db, "conversions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    return onSnapshot(conversions, (snapshot) => {
      const next = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ConversionDocument[];
      setItems(next);
      setLoading(false);
      onCounts?.(next.length, next.filter((item) => item.status === "completed").length);
    }, () => {
      setLoading(false);
      setFeedback({ tone: "error", message: "Não foi possível atualizar o histórico." });
    });
  }, [onCounts, user]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    [],
  );

  async function authorizedFetch(url: string, options?: RequestInit) {
    if (!user) return null;
    const token = await user.getIdToken();
    return fetch(url, {
      ...options,
      headers: { ...options?.headers, Authorization: `Bearer ${token}` },
    });
  }

  async function download(item: ConversionDocument) {
    setAction({ id: item.id, type: "download" });
    setFeedback(null);
    try {
      const response = await authorizedFetch(`/api/conversions/${item.id}/download`);
      if (!response?.ok) throw new Error("DOWNLOAD_FAILED");

      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      link.href = url;
      link.download =
        disposition?.match(/filename="([^"]+)"/)?.[1] ||
        `${item.originalName}-convertido`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ tone: "success", message: "Download iniciado com sucesso." });
    } catch {
      setFeedback({ tone: "error", message: "Não foi possível baixar o arquivo. Tente novamente." });
    } finally {
      setAction(null);
    }
  }

  async function retry(id: string) {
    setAction({ id, type: "retry" });
    setFeedback(null);
    try {
      const response = await authorizedFetch(`/api/conversions/${id}/process`, { method: "POST" });
      if (!response?.ok) throw new Error("RETRY_FAILED");
      setFeedback({ tone: "success", message: "Nova tentativa iniciada." });
    } catch {
      setFeedback({ tone: "error", message: "Não foi possível reiniciar a conversão." });
    } finally {
      setAction(null);
    }
  }

  async function remove(item: ConversionDocument) {
    if (!window.confirm(`Excluir "${item.originalName}" e seus arquivos?`)) return;
    setAction({ id: item.id, type: "delete" });
    setFeedback(null);
    try {
      const response = await authorizedFetch(`/api/conversions/${item.id}`, { method: "DELETE" });
      if (!response?.ok) throw new Error("DELETE_FAILED");
      setFeedback({ tone: "success", message: "Conversão excluída definitivamente." });
    } catch {
      setFeedback({ tone: "error", message: "Não foi possível excluir a conversão." });
    } finally {
      setAction(null);
    }
  }

  return (
    <section className="panel history">
      <div className="panel-head history-head">
        <h2>Conversões recentes</h2>
        <div className="history-feedback" aria-live="polite">
          {feedback && (
            <span className={`feedback feedback-${feedback.tone}`}>
              {feedback.tone === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {feedback.message}
            </span>
          )}
        </div>
      </div>
      {loading ? <><div className="skeleton" /><div className="skeleton" /></> : items.length === 0 ? (
        <div className="empty"><FileText size={34} /><div><strong>Nenhuma conversão ainda</strong><p>Seu primeiro arquivo aparecerá aqui.</p></div></div>
      ) : (
        <ul className="history-list">
          {items.map((item) => {
            const timestamp = item.createdAt as { toDate?: () => Date };
            const activeAction = action?.id === item.id ? action.type : null;
            return (
              <li className="history-item" key={item.id}>
                <div>
                  <div className="file-name">{item.originalName}</div>
                  <div className="file-meta">{item.originalExtension.toUpperCase()} → {item.outputExtension.toUpperCase()} · {formatBytes(item.originalSize)}</div>
                  {item.errorMessage && <div className="error-text">{item.errorMessage}</div>}
                </div>
                <div className={`status status-${item.status}`}><span className="status-dot" />{labels[item.status]}</div>
                <div className="file-meta">{timestamp?.toDate ? dateFormatter.format(timestamp.toDate()) : "Agora"}</div>
                <div className="item-actions">
                  {item.status === "completed" && (
                    <button className="icon-button" title={activeAction === "download" ? "Baixando" : "Baixar"} aria-label={`Baixar ${item.originalName}`} disabled={Boolean(action)} onClick={() => download(item)}>
                      {activeAction === "download" ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}
                    </button>
                  )}
                  {item.status === "failed" && (
                    <button className="icon-button" title={activeAction === "retry" ? "Tentando novamente" : "Tentar novamente"} aria-label={`Tentar ${item.originalName} novamente`} disabled={Boolean(action)} onClick={() => retry(item.id)}>
                      {activeAction === "retry" ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />}
                    </button>
                  )}
                  <button className="icon-button" title={activeAction === "delete" ? "Excluindo" : "Excluir"} aria-label={`Excluir ${item.originalName}`} disabled={Boolean(action) || item.status === "processing"} onClick={() => remove(item)}>
                    {activeAction === "delete" ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
