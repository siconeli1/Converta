import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import type { ConversionDocument } from "@/types/conversion";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const { db, bucket } = getFirebaseAdmin();
    const snapshot = await db.collection("conversions").doc(id).get();
    const conversion = snapshot.data() as Omit<ConversionDocument, "id"> | undefined;
    if (!conversion || conversion.userId !== user.uid || conversion.status !== "completed" || !conversion.outputStoragePath) {
      return NextResponse.json({ error: "Arquivo indisponível." }, { status: 404 });
    }
    const [url] = await bucket.file(conversion.outputStoragePath).getSignedUrl({ action: "read", expires: Date.now() + 5 * 60 * 1000 });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
