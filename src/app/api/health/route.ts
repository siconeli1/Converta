import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportError } from "@/lib/observability";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const deepCheck =
    process.env.HEALTHCHECK_SECRET &&
    request.headers.get("authorization") ===
      `Bearer ${process.env.HEALTHCHECK_SECRET}`;

  if (!deepCheck) {
    return NextResponse.json({
      status: "ok",
      service: "converta",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await getFirebaseAdmin().db.collection("conversions").limit(1).get();
    const dependencies = {
      firestore: "ok",
      blob: process.env.BLOB_READ_WRITE_TOKEN ? "configured" : "missing",
      cloudConvert: process.env.CONVERSION_API_KEY ? "configured" : "missing",
    };
    const healthy = Object.values(dependencies).every((value) => value !== "missing");

    return NextResponse.json({
      status: healthy ? "ok" : "degraded",
      dependencies,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: healthy ? 200 : 503 });
  } catch (error) {
    await reportError(error, { route: "/api/health" });
    return NextResponse.json({
      status: "error",
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
