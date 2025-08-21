export async function getCryptoKey(): Promise<CryptoKey> {
  const { apiKeyKey } = await chrome.storage.local.get('apiKeyKey');
  let keyData: string;
  if (!apiKeyKey) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    keyData = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join('');
    await chrome.storage.local.set({ apiKeyKey: keyData });
  } else {
    keyData = apiKeyKey as string;
  }
  const bytes = Uint8Array.from((keyData.match(/.{2}/g) || []).map(b => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string): Promise<string> {
  if (!text) return '';
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const buffer = new Uint8Array(cipher);
  const combined = new Uint8Array(iv.length + buffer.length);
  combined.set(iv);
  combined.set(buffer, iv.length);
  let binary = '';
  combined.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export async function decrypt(data: string): Promise<string> {
  if (!data) return '';
  const key = await getCryptoKey();
  const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plain);
}
