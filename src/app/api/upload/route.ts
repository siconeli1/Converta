import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { MIME_TYPES } from "@/lib/validation/file";
import type { ConversionDocument } from "@/types/conversion";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
      throw new Error("BLOB_NOT_CONFIGURED");
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_UPLOAD_ERROR";
    console.error("[api/upload] failed", {
      message,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
      hasAdminProject: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
      hasAdminEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
      hasAdminKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    });

    const code =
      message === "BLOB_NOT_CONFIGURED" ||
      message.includes("BLOB_READ_WRITE_TOKEN") ||
      message.includes("blob credentials")
        ? "BLOB_NOT_CONFIGURED"
        : message === "UNAUTHENTICATED"
          ? "AUTH_INVALID"
          : message === "FORBIDDEN"
            ? "UPLOAD_FORBIDDEN"
            : message === "INVALID_UPLOAD"
              ? "UPLOAD_INVALID"
              : "UPLOAD_TOKEN_FAILED";

    return NextResponse.json({ error: code }, { status: 400 });
  }
}
