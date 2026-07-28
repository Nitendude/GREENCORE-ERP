const DEFAULT_LINK_HOURS = 72;
const secret = import.meta.env.VITE_CLIENT_LINK_SECRET || 'local-demo-link-secret-change-before-sharing';

export interface ClientInvite {
  projectId: string;
  expiresAt: number;
  nonce: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createClientInvite(projectId: string, hours = DEFAULT_LINK_HOURS): Promise<string> {
  const invite: ClientInvite = {
    projectId,
    expiresAt: Date.now() + hours * 60 * 60 * 1000,
    nonce: crypto.randomUUID(),
  };
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(invite)));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await getSigningKey(), new TextEncoder().encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifyClientInvite(token: string): Promise<ClientInvite | null> {
  try {
    const [payload, encodedSignature, extra] = token.split('.');
    if (!payload || !encodedSignature || extra) return null;
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getSigningKey(),
      fromBase64Url(encodedSignature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;
    const invite = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as ClientInvite;
    if (!invite.projectId || !invite.expiresAt || invite.expiresAt <= Date.now()) return null;
    return invite;
  } catch {
    return null;
  }
}
