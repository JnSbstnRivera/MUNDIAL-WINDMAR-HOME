export interface Team {
  id: string;
  name: string;
  countryCode: string;
  points: number;
  goals: number;
  color?: string;
  callCenterGroup?: string;
  lastMatchDate?: string;
  leader?: string;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  teamId?: string;
}
