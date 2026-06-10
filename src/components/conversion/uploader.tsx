"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowRight, FileUp, Trash2 } from "lucide-react";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";
import { formatBytes, sanitizeFileName } from "@/lib/utils";
import { getOutputExtension, validateFileMetadata } from "@/lib/validation/file";

export function Uploader() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const maxSize = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 20);
  const validation = file ? validateFileMetadata(file, maxSize) : null;

  function choose(nextFile?: File) {
    setError("");
    if (!nextFile) return;
    const result = validateFileMetadata(nextFile, maxSize);
    if (!result.valid) {
      setFile(null);
      setError(result.error);
      return;
    }
    setFile(nextFile);
  }

  async function convert() {
    if (!user || !file || !validation?.valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const { db } = getFirebaseClient();
      const documentRef = await addDoc(collection(db, "conversions"), {
        userId: user.uid,
        originalName: file.name,
        originalExtension: validation.extension,
        outputExtension: validation.outputExtension,
        originalStoragePath: "",
        outputStoragePath: null,
        originalSize: file.size,
        outputSize: null,
        status: "uploading",
        provider: "cloudconvert",
        providerJobId: null,
        errorCode: null,
        errorMessage: null,
        attemptCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        expiresAt: null,
      });
      const safeName = sanitizeFileName(file.name);
      const path = `users/${user.uid}/conversions/${documentRef.id}/original/${safeName}`;
      const token = await user.getIdToken();
      const blob = await upload(path, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ conversionId: documentRef.id }),
        headers: { Authorization: `Bearer ${token}` },
        contentType: file.type,
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      await updateDoc(documentRef, {
        originalStoragePath: blob.pathname,
        status: "queued",
        updatedAt: serverTimestamp(),
      });
      const response = await fetch(`/api/conversions/${documentRef.id}/process`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("PROCESS_FAILED");
      setFile(null);
      setProgress(0);
    } catch {
      setError("Não foi possível enviar ou processar o arquivo. A conversão pode ser tentada novamente pelo histórico.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Nova conversão</h2></div>
      {!file ? (
        <div
          className="upload-zone"
          data-active={dragging}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}
        >
          <div><FileUp size={37} color="#2457d6" aria-hidden="true" /><h3>Arraste seu arquivo aqui</h3><p>ou clique para selecionar PDF ou DOCX, até {maxSize} MB</p></div>
          <input ref={inputRef} hidden type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => choose(event.target.files?.[0])} />
        </div>
      ) : (
        <div className="file-preview">
          <div className="file-row">
            <div className="file-main"><span className="file-icon">{validation?.valid ? validation.extension.toUpperCase() : "?"}</span><div><div className="file-name">{file.name}</div><div className="file-meta">{formatBytes(file.size)}</div></div></div>
            <button className="icon-button" title="Remover arquivo" aria-label="Remover arquivo" disabled={busy} onClick={() => { setFile(null); setProgress(0); }}><Trash2 size={18} /></button>
          </div>
          {validation?.valid && <div className="conversion-direction"><span>{validation.extension.toUpperCase()}</span><ArrowRight size={18} /><span>{getOutputExtension(validation.extension).toUpperCase()}</span></div>}
          {busy && <div className="progress-track" aria-label={`Progresso: ${progress}%`}><div className="progress-bar" style={{ width: `${progress || 8}%` }} /></div>}
          <button className="button button-primary convert-action" disabled={busy || !validation?.valid} onClick={convert}>{busy ? progress < 100 ? `Enviando ${progress}%` : "Convertendo..." : "Converter agora"}</button>
        </div>
      )}
      {error && <p className="error-text" role="alert" style={{ padding: "0 22px 18px" }}>{error}</p>}
    </section>
  );
}
