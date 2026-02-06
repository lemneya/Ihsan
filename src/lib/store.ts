import { ModelConfig, defaultModel } from "./models";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  model: ModelConfig;
}

// Simple in-memory store (would be replaced with DB in production)
let conversations: Conversation[] = [];

export function getConversations(): Conversation[] {
  return conversations;
}

export function addConversation(conv: Conversation): void {
  conversations = [conv, ...conversations];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
