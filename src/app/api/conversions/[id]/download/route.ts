import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportError } from "@/lib/observability";
import { buildOutputName } from "@/lib/validation/file";
import type { ConversionDocument } from "@/types/conversion";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection("conversions").doc(id).get();
    const conversion = snapshot.data() as Omit<ConversionDocument, "id"> | undefined;
    if (!conversion || conversion.userId !== user.uid || conversion.status !== "completed" || !conversion.outputStoragePath) {
      return NextResponse.json({ error: "Arquivo indisponível." }, { status: 404 });
    }
    const blob = await get(conversion.outputStoragePath, { access: "private" });
    if (!blob) return NextResponse.json({ error: "Arquivo indisponível." }, { status: 404 });
    return new Response(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${buildOutputName(conversion.originalName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    await reportError(error, { route: "/api/conversions/[id]/download" });
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
