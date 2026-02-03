
export type LobbyType = 'Class' | 'Home' | 'Chill';

export interface Message {
  id: string;
  sender: string;
  pub?: string;
  text: string;
  timestamp: Date;
  reactions?: Record<string, string[]>;
}

export interface Presence {
  lastSeen: number;
  lobby: string;
  alias: string;
}

export type ViewState = 'calculator' | 'auth' | 'chat';

export interface UserProfile {
  pub: string;
  alias: string;
  lastSeen?: number;
  currentLobby?: string;
}
