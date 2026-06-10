import { del } from "@vercel/blob";
import type { DocumentReference } from "firebase-admin/firestore";
import type { ConversionDocument } from "@/types/conversion";

export async function deleteConversion(
  reference: DocumentReference,
  conversion: Omit<ConversionDocument, "id">,
) {
  const paths = [conversion.originalStoragePath, conversion.outputStoragePath]
    .filter(Boolean) as string[];

  if (paths.length) await del(paths);
  await reference.delete();
}
