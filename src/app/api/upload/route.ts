import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { MIME_TYPES } from "@/lib/validation/file";
import type { ConversionDocument } from "@/types/conversion";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await requireUser(request);
        const payload = JSON.parse(clientPayload || "{}") as { conversionId?: string };
        if (!payload.conversionId) throw new Error("INVALID_UPLOAD");

        const snapshot = await getFirebaseAdmin().db
          .collection("conversions")
          .doc(payload.conversionId)
          .get();
        const conversion = snapshot.data() as Omit<ConversionDocument, "id"> | undefined;
        const expectedPrefix = `users/${user.uid}/conversions/${payload.conversionId}/original/`;

        if (
          !conversion ||
          conversion.userId !== user.uid ||
          conversion.status !== "uploading" ||
          !pathname.startsWith(expectedPrefix)
        ) {
          throw new Error("FORBIDDEN");
        }

        return {
          allowedContentTypes: [...MIME_TYPES.pdf, ...MIME_TYPES.docx],
          maximumSizeInBytes:
            Number(process.env.CONVERSION_MAX_FILE_SIZE_MB || 20) * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({
            conversionId: payload.conversionId,
            userId: user.uid,
          }),
        };
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Upload não autorizado." }, { status: 400 });
  }
}
