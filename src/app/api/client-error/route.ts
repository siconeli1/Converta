import { NextResponse } from "next/server";
import { reportError } from "@/lib/observability";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      message?: string;
      digest?: string;
      path?: string;
    };
    await reportError(
      new Error((body.message || "Unknown client error").slice(0, 500)),
      {
      route: (body.path || "unknown").slice(0, 200),
      digest: body.digest?.slice(0, 200),
      source: "client-error-boundary",
      },
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
