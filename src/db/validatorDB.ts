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

export interface ValidatorDataComparison {
  current: ValidatorData;
  previous: ValidatorData | null;
  changes: {
    rank?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    balance?: { current: string; previous: string; change: string; direction: 'up' | 'down' | 'same' };
    attestationSuccess?: { current: string; previous: string; change: string; direction: 'up' | 'down' | 'same' };
    totalAttestationsSucceeded?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    totalAttestationsMissed?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    totalBlocksProposed?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    totalBlocksMined?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    totalBlocksMissed?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    totalParticipatingEpochs?: { current: number; previous: number; change: number; direction: 'up' | 'down' | 'same' };
    unclaimedRewards?: { current: string; previous: string; change: string; direction: 'up' | 'down' | 'same' };
    status?: { current: string; previous: string; changed: boolean };
  };
  hasSignificantChanges: boolean;
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
   * Clear logs but keep the most recent log for each validator
   * @param chatId Optional - if provided, only affects logs for specific chat
   * @param address Optional - if provided, only affects logs for specific validator address
   * @returns Object with totalCleared count and array of kept logs info
   */
  async clearLogsKeepLatest(chatId?: number, address?: string): Promise<{
    totalCleared: number;
    keptLogs: Array<{ address: string; chatId: number; timestamp: string }>;
  }> {
    const db = await this.loadDatabase();
    const initialLogCount = db.logs.length;
    const keptLogs: Array<{ address: string; chatId: number; timestamp: string }> = [];

    // Filter logs based on parameters
    let targetLogs = db.logs;
    if (chatId !== undefined && address !== undefined) {
      targetLogs = db.logs.filter(log => log.chatId === chatId && log.address === address);
    } else if (chatId !== undefined) {
      targetLogs = db.logs.filter(log => log.chatId === chatId);
    } else if (address !== undefined) {
      targetLogs = db.logs.filter(log => log.address === address);
    }

    // Group logs by validator address and chatId combination
    const logGroups = new Map<string, ValidatorLog[]>();
    for (const log of targetLogs) {
      const key = `${log.address}_${log.chatId}`;
      if (!logGroups.has(key)) {
        logGroups.set(key, []);
      }
      logGroups.get(key)!.push(log);
    }

    // Find the latest log for each validator/chat combination
    const logsToKeep: ValidatorLog[] = [];
    for (const [key, logs] of logGroups) {
      const sortedLogs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latestLog = sortedLogs[0];
      logsToKeep.push(latestLog);
      keptLogs.push({
        address: latestLog.address,
        chatId: latestLog.chatId,
        timestamp: latestLog.timestamp
      });
    }

    // Get checkIds of logs to keep
    const keepCheckIds = new Set(logsToKeep.map(log => log.checkId));

    // Remove logs that are not in the keep list, but only from the target set
    if (chatId !== undefined && address !== undefined) {
      // Remove logs for specific validator in specific chat, except the latest
      db.logs = db.logs.filter(log => 
        !(log.chatId === chatId && log.address === address) || keepCheckIds.has(log.checkId)
      );
    } else if (chatId !== undefined) {
      // Remove logs for specific chat, except the latest for each validator
      db.logs = db.logs.filter(log => 
        log.chatId !== chatId || keepCheckIds.has(log.checkId)
      );
    } else if (address !== undefined) {
      // Remove logs for specific validator address across all chats, except the latest for each chat
      db.logs = db.logs.filter(log => 
        log.address !== address || keepCheckIds.has(log.checkId)
      );
    } else {
      // Clear all logs except the latest for each validator/chat combination
      db.logs = logsToKeep;
    }

    await this.saveDatabase(db);
    
    return {
      totalCleared: initialLogCount - db.logs.length,
      keptLogs
    };
  }

  /**
   * Compare current validator data with previous data and show changes
   * @param address Validator address
   * @param chatId Chat ID
   * @param currentData Current validator data
   * @returns Comparison object with current, previous data and changes
   */
  async getValidatorDataComparison(address: string): Promise<ValidatorDataComparison> {
    const recentLogs = await this.getRecentLogs(address, 2);
    const currentData = recentLogs[0].data;
    const previousData = recentLogs.length > 1 ? recentLogs[1].data : null;

    const comparison: ValidatorDataComparison = {
      current: currentData,
      previous: previousData,
      changes: {},
      hasSignificantChanges: false
    };

    if (!previousData) {
      comparison.hasSignificantChanges = true;
      return comparison;
    }

    // Helper function to compare numeric values
    const compareNumber = (current: number, previous: number) => {
      const change = current - previous;
      const direction: 'up' | 'down' | 'same' = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
      return { current, previous, change, direction };
    };

    // Helper function to compare string values (for balance, rewards, etc.)
    const compareString = (current: string, previous: string) => {
      const currentNum = parseFloat(current) || 0;
      const previousNum = parseFloat(previous) || 0;
      const changeNum = currentNum - previousNum;
      const direction: 'up' | 'down' | 'same' = changeNum > 0 ? 'up' : changeNum < 0 ? 'down' : 'same';
      const change = changeNum.toString();
      return { current, previous, change, direction };
    };

    // Compare rank (note: lower rank number is better)
    if (currentData.rank !== previousData.rank) {
      comparison.changes.rank = compareNumber(currentData.rank, previousData.rank);
      comparison.hasSignificantChanges = true;
    }

    // Compare balance
    if (currentData.balance !== previousData.balance) {
      comparison.changes.balance = compareString(currentData.balance, previousData.balance);
      comparison.hasSignificantChanges = true;
    }

    // Compare attestation success rate
    if (currentData.attestationSuccess !== previousData.attestationSuccess) {
      comparison.changes.attestationSuccess = compareString(currentData.attestationSuccess, previousData.attestationSuccess);
      comparison.hasSignificantChanges = true;
    }

    // Compare total attestations succeeded
    if (currentData.totalAttestationsSucceeded !== previousData.totalAttestationsSucceeded) {
      comparison.changes.totalAttestationsSucceeded = compareNumber(currentData.totalAttestationsSucceeded, previousData.totalAttestationsSucceeded);
      comparison.hasSignificantChanges = true;
    }

    // Compare total attestations missed
    if (currentData.totalAttestationsMissed !== previousData.totalAttestationsMissed) {
      comparison.changes.totalAttestationsMissed = compareNumber(currentData.totalAttestationsMissed, previousData.totalAttestationsMissed);
      comparison.hasSignificantChanges = true;
    }

    // Compare total blocks proposed
    if (currentData.totalBlocksProposed !== previousData.totalBlocksProposed) {
      comparison.changes.totalBlocksProposed = compareNumber(currentData.totalBlocksProposed, previousData.totalBlocksProposed);
      comparison.hasSignificantChanges = true;
    }

    // Compare total blocks mined
    if (currentData.totalBlocksMined !== previousData.totalBlocksMined) {
      comparison.changes.totalBlocksMined = compareNumber(currentData.totalBlocksMined, previousData.totalBlocksMined);
      comparison.hasSignificantChanges = true;
    }

    // Compare total blocks missed
    if (currentData.totalBlocksMissed !== previousData.totalBlocksMissed) {
      comparison.changes.totalBlocksMissed = compareNumber(currentData.totalBlocksMissed, previousData.totalBlocksMissed);
      comparison.hasSignificantChanges = true;
    }

    // Compare total participating epochs
    if (currentData.totalParticipatingEpochs !== previousData.totalParticipatingEpochs) {
      comparison.changes.totalParticipatingEpochs = compareNumber(currentData.totalParticipatingEpochs, previousData.totalParticipatingEpochs);
      comparison.hasSignificantChanges = true;
    }

    // Compare unclaimed rewards
    if (currentData.unclaimedRewards !== previousData.unclaimedRewards) {
      comparison.changes.unclaimedRewards = compareString(currentData.unclaimedRewards, previousData.unclaimedRewards);
      comparison.hasSignificantChanges = true;
    }

    // Compare status
    if (currentData.status !== previousData.status) {
      comparison.changes.status = {
        current: currentData.status,
        previous: previousData.status,
        changed: true
      };
      comparison.hasSignificantChanges = true;
    }

    return comparison;
  }

  /**
   * Format changes for display with indicators like +2, -3, etc.
   * @param comparison Validator data comparison object
   * @returns Formatted string representation of changes
   */
  formatChanges(comparison: ValidatorDataComparison): string {
    if (!comparison.hasSignificantChanges) {
      return "No significant changes";
    }

    const changes: string[] = [];

    if (comparison.changes.rank) {
      const { change, direction } = comparison.changes.rank;
      const indicator = direction === 'up' ? `+${change}` : direction === 'down' ? `${change}` : '0';
      // For rank, up means worse (higher number), down means better (lower number)
      const trend = direction === 'down' ? '📈' : direction === 'up' ? '📉' : '➡️';
      changes.push(`Rank: ${comparison.changes.rank.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.balance) {
      const { change, direction } = comparison.changes.balance;
      const changeNum = parseFloat(change);
      const indicator = changeNum > 0 ? `+${changeNum.toFixed(4)}` : changeNum.toFixed(4);
      const trend = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
      changes.push(`Balance: ${comparison.changes.balance.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.attestationSuccess) {
      const { change, direction } = comparison.changes.attestationSuccess;
      const changeNum = parseFloat(change);
      const indicator = changeNum > 0 ? `+${changeNum.toFixed(2)}%` : `${changeNum.toFixed(2)}%`;
      const trend = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
      changes.push(`Attestation Success: ${comparison.changes.attestationSuccess.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.totalAttestationsSucceeded) {
      const { change, direction } = comparison.changes.totalAttestationsSucceeded;
      const indicator = change > 0 ? `+${change}` : `${change}`;
      const trend = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
      changes.push(`Attestations Succeeded: ${comparison.changes.totalAttestationsSucceeded.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.totalAttestationsMissed) {
      const { change, direction } = comparison.changes.totalAttestationsMissed;
      const indicator = change > 0 ? `+${change}` : `${change}`;
      // For missed attestations, up is bad, down is good
      const trend = direction === 'down' ? '📈' : direction === 'up' ? '📉' : '➡️';
      changes.push(`Attestations Missed: ${comparison.changes.totalAttestationsMissed.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.totalBlocksMined) {
      const { change, direction } = comparison.changes.totalBlocksMined;
      const indicator = change > 0 ? `+${change}` : `${change}`;
      const trend = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
      changes.push(`Blocks Mined: ${comparison.changes.totalBlocksMined.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.unclaimedRewards) {
      const { change, direction } = comparison.changes.unclaimedRewards;
      const changeNum = parseFloat(change);
      const indicator = changeNum > 0 ? `+${changeNum.toFixed(4)}` : changeNum.toFixed(4);
      const trend = direction === 'up' ? '📈' : direction === 'down' ? '📉' : '➡️';
      changes.push(`Unclaimed Rewards: ${comparison.changes.unclaimedRewards.current} (${indicator}) ${trend}`);
    }

    if (comparison.changes.status) {
      changes.push(`Status: ${comparison.changes.status.previous} → ${comparison.changes.status.current} 🔄`);
    }

    return changes.join('\n');
  }
}