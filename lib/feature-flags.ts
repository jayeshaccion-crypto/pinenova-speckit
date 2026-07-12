export function isEnabled(flagName: string): boolean {
  const val = process.env[`FLAG_${flagName}`];
  if (val === undefined) return false;
  return val === "true" || val === "1";
}
