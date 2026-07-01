export type TournamentType = 'league' | 'knockout';

export interface Player {
  id: string;
  name: string;
  rg: string;
  birthDate: string;
}

export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind color class for visual identification
  players?: Player[];
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  round: number; // For league: round number. For knockout: round index (0 = QF, 1 = SF, 2 = Final)
  matchIndex: number; // Index of the match within that round
  penaltiesHome?: number | null;
  penaltiesAway?: number | null;
  phase?: 'group' | 'semifinal' | 'final'; // Optional: for group stage + knockout tournaments
  group?: 'A' | 'B';                       // Optional: Group A or Group B
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  teams: Team[];
  matches: Match[];
  status: 'setup' | 'active' | 'completed';
  winnerId: string | null;
  createdAt: string;
  rules?: {
    victoryPoints: number;
    drawPoints: number;
    defeatPoints: number;
  };
}

export interface TeamStats {
  teamId: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}
