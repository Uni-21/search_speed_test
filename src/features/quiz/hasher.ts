export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function checkAnswer(userInput: string, acceptedHashes: string[]): Promise<boolean> {
  const hash = await sha256Hex(userInput);
  return acceptedHashes.includes(hash);
}