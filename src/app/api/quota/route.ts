import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getConversionQuotaStatus } from "@/lib/conversion/quota";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportError } from "@/lib/observability";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const status = await getConversionQuotaStatus(
      getFirebaseAdmin().db,
      user.uid,
    );
    return NextResponse.json(status, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 500;
    if (status === 500) {
      await reportError(error, { route: "/api/quota", status });
    }
    return NextResponse.json(
      { error: status === 401 ? "Acesso negado." : "Não foi possível consultar o limite." },
      { status },
    );
  }
}
