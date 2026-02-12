
export interface Position {
  x: number;
  y: number;
}

export interface Fragment {
  id: string;
  x: number;
  y: number;
  name: string;
  verse: string;
  collected: boolean;
}

export interface SoulNPC {
  id: string;
  x: number;
  y: number;
  saved: boolean;
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  CONVERSATION = 'CONVERSATION',
  EVANGELIZING = 'EVANGELIZING',
  WON = 'WON',
  EPILOGUE = 'EPILOGUE'
}
