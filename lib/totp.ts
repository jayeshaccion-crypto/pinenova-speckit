import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "PineNova";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function getTotpUrl(secret: string, email: string): string {
  return generateURI({
    issuer: APP_NAME,
    label: email,
    secret,
  });
}

export async function generateQrCode(secret: string, email: string): Promise<string> {
  const otpauth = getTotpUrl(secret, email);
  return QRCode.toDataURL(otpauth);
}

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ token, secret, epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}
