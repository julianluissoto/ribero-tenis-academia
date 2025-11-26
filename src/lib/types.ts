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

export type PlayerFormData = Omit<Player, 'id' | 'classesRemaining'> & { subscription: SubscriptionType };

export type ConfirmedClass = {
  date: string;
  time: string;
  category: string;
  gender: string;
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
  players: Player[]; // All players in the tournament
  groups: Group[];
  playoff?: Playoff;
}
