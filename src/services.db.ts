// Simple localStorage-backed database for the Life RPG prototype (Model 3)

import { PlanDiario, TareaPlanificada, TaskDefinition } from './models';

export type ThemeKey = 'videoGame' | 'hacker' | 'future' | 'woman' | 'man';
export type LanguageKey = 'es' | 'en' | 'zh' | 'ja' | 'fr' | 'de' | 'it' | 'ar';

export interface DbUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  profileImage?: string; // data URL or remote URL
  selectedTheme: ThemeKey;
  selectedLanguage: LanguageKey;
  registrationDate: string; // ISO
}

export interface DailyStatRecord {
  date: string; // YYYY-MM-DD
  xp: number;
  completion: number; // 0-1
  byCategory: { [category: string]: number };
}

export interface StatsSnapshot {
  daily: DailyStatRecord[];
}

export interface StoredPlanSnapshot {
  plan: PlanDiario;
  tareasDia: TareaPlanificada[];
}

export interface DbSchema {
  users: DbUser[];
  currentUserId?: string;
  statsByUser: { [userId: string]: StatsSnapshot };
  tasksByUser: { [userId: string]: TaskDefinition[] };
  lastPlanByUser: { [userId: string]: StoredPlanSnapshot };
}

const STORAGE_KEY = 'lifeRpgModel3Db';

const defaultDb: DbSchema = {
  users: [],
  currentUserId: undefined,
  statsByUser: {},
  tasksByUser: {},
  lastPlanByUser: {},
};

export function loadDb(): DbSchema {
  if (typeof window === 'undefined') return defaultDb;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultDb;
  try {
    const parsed = JSON.parse(raw) as DbSchema;
    return { ...defaultDb, ...parsed };
  } catch {
    return defaultDb;
  }
}

export function saveDb(db: DbSchema) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getCurrentUser(): DbUser | undefined {
  const db = loadDb();
  if (!db.currentUserId) return undefined;
  return db.users.find((u) => u.id === db.currentUserId);
}

export function setCurrentUser(userId: string | undefined) {
  const db = loadDb();
  const next: DbSchema = { ...db, currentUserId: userId };
  saveDb(next);
}

export function upsertUser(user: DbUser) {
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === user.id);
  const users = [...db.users];
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  const next: DbSchema = { ...db, users };
  saveDb(next);
}

export function updateUser(userId: string, partial: Partial<DbUser>): DbUser | undefined {
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return undefined;
  const updated: DbUser = { ...db.users[idx], ...partial };
  const users = [...db.users];
  users[idx] = updated;
  const next: DbSchema = { ...db, users };
  saveDb(next);
  return updated;
}

export function saveStats(userId: string, stats: StatsSnapshot) {
  const db = loadDb();
  const statsByUser = { ...db.statsByUser, [userId]: stats };
  const next: DbSchema = { ...db, statsByUser };
  saveDb(next);
}

export function getStats(userId: string): StatsSnapshot {
  const db = loadDb();
  return db.statsByUser[userId] ?? { daily: [] };
}

export function getUserTasks(userId: string): TaskDefinition[] {
  const db = loadDb();
  return db.tasksByUser[userId] ?? [];
}

export function saveUserTasks(userId: string, tasks: TaskDefinition[]) {
  const db = loadDb();
  const tasksByUser = { ...db.tasksByUser, [userId]: tasks };
  const next: DbSchema = { ...db, tasksByUser };
  saveDb(next);
}

export function getLastPlan(userId: string): StoredPlanSnapshot | undefined {
  const db = loadDb();
  return db.lastPlanByUser[userId];
}

export function saveLastPlan(userId: string, snapshot: StoredPlanSnapshot) {
  const db = loadDb();
  const lastPlanByUser = { ...db.lastPlanByUser, [userId]: snapshot };
  const next: DbSchema = { ...db, lastPlanByUser };
  saveDb(next);
}
