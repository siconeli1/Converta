import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { deleteConversion } from "@/lib/conversion/delete-conversion";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { logInfo, reportError } from "@/lib/observability";
import type { ConversionDocument } from "@/types/conversion";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const startedAt = Date.now();
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db
      .collection("conversions")
      .where("expiresAt", "<=", Timestamp.now())
      .limit(100)
      .get();

    let deleted = 0;
    const failures: string[] = [];

    for (const document of snapshot.docs) {
      try {
        await deleteConversion(
          document.ref,
          document.data() as Omit<ConversionDocument, "id">,
        );
        deleted += 1;
      } catch (error) {
        failures.push(document.id);
        await reportError(error, {
          route: "/api/cron/cleanup",
          conversionId: document.id,
        });
      }
    }

    logInfo("Expired conversions cleanup completed", {
      route: "/api/cron/cleanup",
      selected: snapshot.size,
      deleted,
      failed: failures.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      ok: failures.length === 0,
      selected: snapshot.size,
      deleted,
      failed: failures.length,
    });
  } catch (error) {
    await reportError(error, {
      route: "/api/cron/cleanup",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
