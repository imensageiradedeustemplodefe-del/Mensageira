import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// AES-256-GCM, compatible with the original edge function format: base64(iv(12) + ciphertext + tag)
function keyBytes() {
  const key = process.env.CONTACT_ENCRYPTION_KEY;
  if (!key) throw new Error("CONTACT_ENCRYPTION_KEY não configurada");
  return Buffer.from(key.padEnd(32, "0").slice(0, 32), "utf8");
}

export function encryptContact(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

export function decryptContact(payload: string): string {
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(buf.length - 16);
    const data = buf.subarray(12, buf.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "[Dados criptografados - erro na descriptografia]";
  }
}

export function encryptionKeyHash(): string {
  return createHash("sha256").update(process.env.CONTACT_ENCRYPTION_KEY ?? "").digest("base64").slice(0, 16);
}
