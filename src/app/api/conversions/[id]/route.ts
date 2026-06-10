import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { deleteConversion } from "@/lib/conversion/delete-conversion";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportError } from "@/lib/observability";
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
    await deleteConversion(reference, conversion);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await reportError(error, { route: "/api/conversions/[id]", operation: "delete" });
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
