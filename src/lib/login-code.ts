/**
 * Short human-comparable confirmation code.
 *
 * The alphabet drops characters people misread aloud or on screen — no O/0,
 * no I/1/L — because the entire point is that two humans compare two screens.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

export function generateLoginCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}
