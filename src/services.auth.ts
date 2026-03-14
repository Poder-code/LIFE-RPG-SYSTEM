import { DbUser, LanguageKey, ThemeKey, loadDb, saveDb, setCurrentUser } from './services.db';

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  profileImage?: string;
  language: LanguageKey;
  theme: ThemeKey;
}

export async function registerUser(payload: RegisterPayload): Promise<DbUser> {
  const db = loadDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }
  const id = `u-${Date.now()}`;
  const passwordHash = await sha256(payload.password);
  const user: DbUser = {
    id,
    email: payload.email,
    username: payload.username,
    passwordHash,
    profileImage: payload.profileImage,
    selectedLanguage: payload.language,
    selectedTheme: payload.theme,
    registrationDate: new Date().toISOString(),
  };
  const next = { ...db, users: [...db.users, user], currentUserId: id };
  saveDb(next);
  return user;
}

export async function loginUser(email: string, password: string): Promise<DbUser> {
  const db = loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const hashed = await sha256(password);
  if (hashed !== user.passwordHash) throw new Error('INVALID_CREDENTIALS');
  setCurrentUser(user.id);
  return user;
}

export function logoutUser() {
  setCurrentUser(undefined);
}
