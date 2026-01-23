import type { Room, Transaction, Vote, DisconnectedSession } from '@blue-banker/shared';

class Store {
  public rooms: Map<string, Room> = new Map();
  // We can store transactions/votes by ID or grouped by Room depending on access patterns
  // For now, simple maps or arrays
  // But shared types don't define a global list, just entities.
  
  // Let's store transactions per Room for easier lookup? or Global?
  // User Story 2 says "View transaction history". Usually filtered by player or room.
  public transactions: Map<string, Transaction> = new Map(); 
  public votes: Map<string, Vote> = new Map();
  // Disconnected sessions for reconnection (T013)
  public disconnectedSessions: Map<string, DisconnectedSession> = new Map();

  constructor() {
    this.rooms = new Map();
  }

  reset() {
    this.rooms.clear();
    this.transactions.clear();
    this.votes.clear();
    this.disconnectedSessions.clear();
  }
}

export const store = new Store();

