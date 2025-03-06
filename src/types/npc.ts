export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface AnimationModel {
  name: string;
  path: string;
}

export interface NPCData {
  id: string;
  name: string;
  persona: string;
  position: Position;
  animations: {
    [key: string]: string;  // key is animation name (idle, walking, etc), value is path
  };
  defaultAnimation: string;  // e.g., "idle"
  scene: string;
  rotation: number;
  scale: number;
  interactionRadius: number;
  initialMemories: string[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: 'user' | 'npc';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: number;
  npc_id: string;
  timestamp: number;
  messages: Message[];
} 