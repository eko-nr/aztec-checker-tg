import fs from "fs/promises";
import path from "path";

export interface ValidatorData {
  index: string;
  rank: number;
  address: string;
  status: string;
  balance: string;
  attestationSuccess: string;
  withdrawalCredentials: string;
  recentAttestations: Array<{
    epoch: number;
    slot: number;
    status: string;
  }>;
  proposalHistory: Array<{
    epoch: number;
    slot: number;
    status: string;
  }>;
  votingHistory: Array<{
    epoch: number;
    voted: boolean;
    timestamp: string;
    slot_number: number;
    round_number: number;
    proposal_address: string;
    vote_type: string;
    transaction_hash: string;
  }>;
  totalAttestationsSucceeded: number;
  totalAttestationsMissed: number;
  totalBlocksProposed: number;
  totalBlocksMined: number;
  totalBlocksMissed: number;
  totalParticipatingEpochs: number;
  epochPerformanceHistory: Array<{
    epochNumber: number;
    attestationsSuccessful: number;
    attestationsMissed: number;
    blocksProposed: number;
    blocksMined: number;
    blocksMissed: number;
  }>;
  x_user_id: string;
  x_handle: string;
  x_image_url: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string;
  name: string;
  activationDate: string;
  unclaimedRewards: string;
}

export interface ValidatorLog {
  address: string;
  chatId: number;
  timestamp: string;
  data: ValidatorData;
  checkId: string;
}

interface DatabaseStructure {
  validators: Array<{
    address: string;
    chatId: number;
    addedAt: string;
  }>;
  logs: ValidatorLog[];
}

export class ValidatorDatabase {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), "json", "validator_db.json");
  }

  private async ensureDbExists(): Promise<void> {
    try {
      // Ensure json directory exists
      const jsonDir = path.dirname(this.dbPath);
      await fs.mkdir(jsonDir, { recursive: true });

      // Check if database file exists
      await fs.access(this.dbPath);
    } catch {
      // Create initial database structure
      const initialDb: DatabaseStructure = {
        validators: [],
        logs: []
      };
      await fs.writeFile(this.dbPath, JSON.stringify(initialDb, null, 2));
    }
  }

  async loadDatabase(): Promise<DatabaseStructure> {
    await this.ensureDbExists();
    const data = await fs.readFile(this.dbPath, "utf-8");
    return JSON.parse(data);
  }

  async saveDatabase(db: DatabaseStructure): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(db, null, 2));
  }

  async addValidator(address: string, chatId: number): Promise<boolean> {
    const db = await this.loadDatabase();
    
    // Check if validator already exists for this chat
    const exists = db.validators.some(v => v.address === address && v.chatId === chatId);
    if (!exists) {
      db.validators.push({
        address,
        chatId,
        addedAt: new Date().toISOString()
      });
      await this.saveDatabase(db);
      return true;
    }
    return false;
  }

  async removeValidator(address: string, chatId: number): Promise<boolean> {
    const db = await this.loadDatabase();
    const initialLength = db.validators.length;
    
    db.validators = db.validators.filter(v => !(v.address === address && v.chatId === chatId));
    
    if (db.validators.length < initialLength) {
      await this.saveDatabase(db);
      return true;
    }
    return false;
  }

  async getValidators(): Promise<Array<{ address: string; chatId: number }>> {
    const db = await this.loadDatabase();
    return db.validators;
  }

  async getChatValidators(chatId: number): Promise<Array<{ address: string; addedAt: string }>> {
    const db = await this.loadDatabase();
    return db.validators
      .filter(v => v.chatId === chatId)
      .map(v => ({ address: v.address, addedAt: v.addedAt }));
  }

  async addLog(address: string, chatId: number, data: ValidatorData): Promise<void> {
    const db = await this.loadDatabase();
    
    const log: ValidatorLog = {
      address,
      chatId,
      timestamp: new Date().toISOString(),
      data,
      checkId: `${address}_${Date.now()}`
    };

    db.logs.push(log);

    // Keep only last 1 logs per address
    const logsByAddress = db.logs.filter(l => l.data.address === address && l.chatId === chatId);
    if (logsByAddress.length > 1) {
      // remove the oldest logs for this chat
      const excess = logsByAddress.length - 1;
      const sorted = logsByAddress.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const toRemove = sorted.slice(0, excess).map(l => l.checkId);

      db.logs = db.logs.filter(l => !toRemove.includes(l.checkId));
    }

    await this.saveDatabase(db);
  }

  async getRecentLogs(address: string, limit: number = 10): Promise<ValidatorLog[]> {
    const db = await this.loadDatabase();
    return db.logs
      .filter(log => log.address === address)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getLatestLog(address: string): Promise<ValidatorLog | null> {
    const logs = await this.getRecentLogs(address, 1);
    return logs.length > 0 ? logs[0] : null;
  }

  // Check if validator data has changed significantly
  hasDataChanged(oldData: ValidatorData | null, newData: ValidatorData): boolean {
    if (!oldData) return true; // First time checking, always send

    // Compare key fields that matter for notifications
    return (
      oldData.status !== newData.status ||
      oldData.balance !== newData.balance ||
      oldData.attestationSuccess !== newData.attestationSuccess ||
      oldData.totalAttestationsSucceeded !== newData.totalAttestationsSucceeded ||
      oldData.totalAttestationsMissed !== newData.totalAttestationsMissed ||
      oldData.totalBlocksMined !== newData.totalBlocksMined ||
      oldData.unclaimedRewards !== newData.unclaimedRewards
    );
  }

  async getLatestLogsByChat(chatId: number, limit: number = 5): Promise<ValidatorLog[]> {
    const db = await this.loadDatabase();

    return db.logs
      .filter(log => log.chatId === chatId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear all logs while keeping validator addresses and chat IDs
   * @param chatId Optional - if provided, only clears logs for specific chat
   * @param address Optional - if provided, only clears logs for specific validator address
   * @returns Number of logs cleared
   */
  async clearLogs(chatId?: number, address?: string): Promise<number> {
    const db = await this.loadDatabase();
    const initialLogCount = db.logs.length;

    if (chatId !== undefined && address !== undefined) {
      // Clear logs for specific validator in specific chat
      db.logs = db.logs.filter(log => !(log.chatId === chatId && log.address === address));
    } else if (chatId !== undefined) {
      // Clear logs for specific chat
      db.logs = db.logs.filter(log => log.chatId !== chatId);
    } else if (address !== undefined) {
      // Clear logs for specific validator address across all chats
      db.logs = db.logs.filter(log => log.address !== address);
    } else {
      // Clear all logs
      db.logs = [];
    }

    await this.saveDatabase(db);
    return initialLogCount - db.logs.length;
  }

  /**
   * Purge ALL logs from the database while keeping validator addresses and chat IDs
   * This is a complete log wipe for all users and validators
   * @returns Number of logs purged
   */
  async purgeAllLogs(): Promise<number> {
    const db = await this.loadDatabase();
    const totalLogsCleared = db.logs.length;

    // Clear all logs but keep validators array intact
    db.logs = [];

    await this.saveDatabase(db);
    return totalLogsCleared;
  }
}