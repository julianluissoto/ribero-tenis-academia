// Genders
export const GENDERS = ['Masculino', 'Femenino'] as const;
export type Gender = typeof GENDERS[number];

// Categorías masculino
export const MASCULINO_CATEGORIES = ['4to', '3ro', '2do'] as const;
export type MasculinoCategory = typeof MASCULINO_CATEGORIES[number];

// Categorías femenino
export const FEMENINO_CATEGORIES = ['A', 'B'] as const;
export type FemeninoCategory = typeof FEMENINO_CATEGORIES[number];

// Categorías unificadas
export const ALL_CATEGORIES = [
  ...MASCULINO_CATEGORIES,
  ...FEMENINO_CATEGORIES,
] as const;

export type Category = typeof ALL_CATEGORIES[number];

// Suscripciones
export const SUBSCRIPTION_TYPES = ['per_class', 'monthly_8', 'monthly_10', 'monthly_12'] as const;
export type SubscriptionType = typeof SUBSCRIPTION_TYPES[number];

export const SUBSCRIPTION_DETAILS: Record<
  SubscriptionType,
  { label: string; classes: number }
> = {
  per_class: { label: 'Por Clase', classes: 9999 },
  monthly_8: { label: 'Mensual (8 clases)', classes: 8 },
  monthly_10: { label: 'Mensual (10 clases)', classes: 10 },
  monthly_12: { label: 'Mensual (12 clases)', classes: 12 },
};

// Capacidad
export const COURT_CAPACITY = 4;
export const TOTAL_COURTS = 2;
export const CLASS_CAPACITY = COURT_CAPACITY * TOTAL_COURTS;

// ------------------------------------------------------
// Jugador
// ------------------------------------------------------
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

export type PlayerFormData = Omit<Player, 'id' | 'classesRemaining'>;

export type AttendanceStatus = "present" | "absent" | "pending";

// ------------------------------------------------------
// Registro asistencia
// ------------------------------------------------------
export interface AttendanceRecord {
  playerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AttendanceStatus;
}

// ------------------------------------------------------
// Torneos
// ------------------------------------------------------
export type ConfirmedClass = {
  date: string;
  time: string;
  category: Category;
  gender: Gender;
  players: Player[];
};

export interface SetScore {
  score1: number | null;
  score2: number | null;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  sets: [SetScore, SetScore, SetScore];
  winner?: 'player1' | 'player2' | null;
}

export interface Group {
  id: string;
  name: string;
  players: Player[];
  matches: Match[];
}

export interface Playoff {
  semifinals: [Match, Match];
  final: Match | null;
}

export interface Tournament {
  id: string;
  name: string;
  category: Category;
  players: Player[];
  groups: Group[];
  playoff?: Playoff;
}
