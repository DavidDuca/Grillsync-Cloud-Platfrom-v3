import crypto from "crypto";
import bcrypt from "bcryptjs";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const randHex = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, h: string) => bcrypt.compare(pw, h);

// Hash an API secret for at-rest storage (we use sha256 not bcrypt because
// the POS-side HMAC key is sha256(secret), so we can verify HMAC directly
// from the stored hash without ever needing the plaintext again).
export const hashApiSecret = (s: string) => sha256(s);

// Verify HMAC signature from the POS using the stored secret hash.
// Mirrors syncService.js exactly: hmacKey = sha256(plainSecret) hex, then
// HMAC_SHA256(hmacKey, `${timestamp}.${body}`).
export function verifyHmac(opts: {
  storedSecretHash: string;
  timestamp: string;
  body: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", opts.storedSecretHash)
    .update(`${opts.timestamp}.${opts.body}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(opts.signature, "hex")
    );
  } catch { return false; }
}
