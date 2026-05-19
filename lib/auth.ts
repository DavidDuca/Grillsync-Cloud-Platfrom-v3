import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export type AuthCtx = { userId: string; restaurantId: string; role: string };

export function getAuth(req: NextRequest): AuthCtx | null {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  return verifyToken<AuthCtx>(token);
}

export function requireAuth(req: NextRequest): AuthCtx {
  const a = getAuth(req);
  if (!a) throw new Response("Unauthorized", { status: 401 });
  return a;
}
