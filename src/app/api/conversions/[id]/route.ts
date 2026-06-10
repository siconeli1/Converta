import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import type { ConversionDocument } from "@/types/conversion";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const { db } = getFirebaseAdmin();
    const reference = db.collection("conversions").doc(id);
    const snapshot = await reference.get();
    const conversion = snapshot.data() as Omit<ConversionDocument, "id"> | undefined;
    if (!conversion || conversion.userId !== user.uid) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    const paths = [conversion.originalStoragePath, conversion.outputStoragePath].filter(Boolean) as string[];
    if (paths.length) await del(paths);
    await reference.delete();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
