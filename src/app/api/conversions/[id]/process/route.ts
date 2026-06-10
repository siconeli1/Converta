import { get, put } from "@vercel/blob";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getConversionProvider } from "@/lib/conversion/get-provider";
import { ConversionProviderError } from "@/lib/conversion/provider";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { buildOutputName, validateFileMetadata } from "@/lib/validation/file";
import type { ConversionDocument } from "@/types/conversion";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const { db } = getFirebaseAdmin();
    const reference = db.collection("conversions").doc(id);
    const claimed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("NOT_FOUND");
      const data = snapshot.data() as Omit<ConversionDocument, "id">;
      if (data.userId !== user.uid) throw new Error("FORBIDDEN");
      if (!["queued", "failed"].includes(data.status)) throw new Error("ALREADY_PROCESSING");
      const validation = validateFileMetadata({ name: data.originalName, size: data.originalSize }, Number(process.env.CONVERSION_MAX_FILE_SIZE_MB || 20));
      if (!validation.valid) throw new Error("INVALID_FILE");
      transaction.update(reference, {
        status: "processing",
        updatedAt: FieldValue.serverTimestamp(),
        attemptCount: FieldValue.increment(1),
        errorCode: null,
        errorMessage: null,
      });
      return data;
    });

    const sourceBlob = await get(claimed.originalStoragePath, { access: "private" });
    if (!sourceBlob) throw new Error("SOURCE_MISSING");
    const source = Buffer.from(await new Response(sourceBlob.stream).arrayBuffer());

    const outputName = buildOutputName(claimed.originalName);
    const provider = getConversionProvider();
    const result = await provider.convert({
      source,
      sourceName: claimed.originalName,
      inputFormat: claimed.originalExtension,
      outputFormat: claimed.outputExtension,
      outputName,
    });
    const outputResponse = await fetch(result.downloadUrl);
    if (!outputResponse.ok) throw new ConversionProviderError("PROVIDER_DOWNLOAD_FAILED", "Falha ao obter o arquivo convertido.");
    const output = Buffer.from(await outputResponse.arrayBuffer());
    const outputPath = `users/${user.uid}/conversions/${id}/output/${outputName}`;
    const outputBlob = await put(outputPath, output, {
      access: "private",
      addRandomSuffix: false,
      contentType: claimed.outputExtension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await reference.update({
      status: "completed",
      provider: provider.name,
      providerJobId: result.jobId,
      outputStoragePath: outputBlob.pathname,
      outputSize: output.length,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : message === "ALREADY_PROCESSING" ? 409 : 500;
    if (status === 500) {
      try {
        const { id } = await context.params;
        await getFirebaseAdmin().db.collection("conversions").doc(id).update({
          status: "failed",
          errorCode: error instanceof ConversionProviderError ? error.code : "PROCESSING_FAILED",
          errorMessage: error instanceof ConversionProviderError ? error.message : "Não foi possível concluir a conversão.",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {}
    }
    return NextResponse.json({ error: status === 409 ? "Esta conversão já está em andamento." : status < 500 ? "Acesso negado." : "Não foi possível concluir a conversão." }, { status });
  }
}
