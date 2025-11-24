export type Category = "4to" | "3ro" | "2do";
export const CATEGORIES: Category[] = ["4to", "3ro", "2do"];

export type Gender = 'Masculino' | 'Femenino';
export const GENDERS: Gender[] = ['Masculino', 'Femenino'];

export type AttendanceStatus = 'present' | 'absent' | null;

export type SubscriptionType = 'monthly' | 'none';
export const SUBSCRIPTION_TYPES: SubscriptionType[] = ['monthly', 'none'];

export interface Player {
  id: string;
  name: string;
  surname: string;
  telefono: string;
  category: Category;
  gender: Gender;
  subscription: SubscriptionType;
  classesRemaining: number;
}

export interface AttendanceRecord {
  playerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AttendanceStatus;
}
