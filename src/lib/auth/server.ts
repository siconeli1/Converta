import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function requireUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHENTICATED");
  const token = authorization.slice(7);
  try {
    return await getFirebaseAdmin().auth.verifyIdToken(token);
  } catch {
    throw new Error("UNAUTHENTICATED");
  }
}
