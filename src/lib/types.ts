// =========================
// CATEGORIES
// =========================
export const CATEGORIES = ["4to", "3ro", "2do"] as const;
export type Category = (typeof CATEGORIES)[number];

// =========================
// GENDERS
// =========================
export const GENDERS = ["Masculino", "Femenino"] as const;
export type Gender = (typeof GENDERS)[number];

// =========================
// ATTENDANCE STATUS
// =========================
export type AttendanceStatus = "present" | "absent" | null;

// =========================
// SUBSCRIPTION TYPES
// =========================
export const SUBSCRIPTION_TYPES = [
  "per_class",
  "monthly_8",
  "monthly_10",
  "monthly_12",
] as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

// Subscription details
export const SUBSCRIPTION_DETAILS: Record<
  SubscriptionType,
  { label: string; classes: number }
> = {
  per_class: { label: "Por Clase", classes: 0 },
  monthly_8: { label: "Mensual (8 clases)", classes: 8 },
  monthly_10: { label: "Mensual (10 clases)", classes: 10 },
  monthly_12: { label: "Mensual (12 clases)", classes: 12 },
};

// =========================
// PLAYER
// =========================
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

// =========================
// ATTENDANCE RECORD
// =========================
export interface AttendanceRecord {
  playerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AttendanceStatus;
}

// =========================
// PLAYER FORM DATA
// =========================
export type PlayerFormData = Omit<Player, "id" | "classesRemaining">;

// =========================
// CONFIRMED CLASS
// =========================
export type ConfirmedClass = {
  date: string;
  time: string;
  category: string;
  gender: string;
  players: Player[];
};

// =========================
// MATCH / SCORES
// =========================
export interface SetScore {
  score1: number | null;
  score2: number | null;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  sets: [SetScore, SetScore, SetScore];
  winner?: "player1" | "player2" | null;
}

// =========================
// GROUP
// =========================
export interface Group {
  id: string;
  name: string;
  players: Player[];
  matches: Match[];
}

// =========================
// PLAYOFF
// =========================
export interface Playoff {
  semifinals: [Match, Match];
  final: Match | null;
}

// =========================
// TOURNAMENT
// =========================
export interface Tournament {
  id: string;
  name: string;
  category: Category;
  players: Player[];
  groups: Group[];
  playoff?: Playoff;
}
