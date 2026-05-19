import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

export function signToken(payload: object, expiresIn = "30d") {
  return jwt.sign(payload, SECRET, { expiresIn });
}
export function verifyToken<T = any>(token: string): T | null {
  try { return jwt.verify(token, SECRET) as T; } catch { return null; }
}
