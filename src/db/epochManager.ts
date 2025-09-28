import { promises as fs } from 'fs';
import path from 'path';

interface SlotData {
  slotNumber: number;
  status: string;
  tooltip: string;
}

interface ValidatorActivity {
  validatorIndex: string;
  validatorAddress: string;
  displayName: string;
  x_handle: string | null;
  name: string | null;
  slots?: SlotData[];
}

interface RawEpochData {
  activities: ValidatorActivity[];
}

interface CleanValidatorActivity {
  validatorIndex: string;
  validatorAddress: string;
  displayName: string;
  x_handle: string | null;
  name: string | null;
  slotsCount: number;
}

interface ProcessedEpochData {
  epoch: number;
  activities: CleanValidatorActivity[];
  timestamp: string;
  totalValidators: number;
}

interface EpochDatabase {
  metadata: {
    totalEpochs: number;
    epochRange: {
      start: number;
      end: number;
    };
    lastUpdated: string;
    version: string;
  };
  epochs: { [key: number]: ProcessedEpochData };
}

interface BulkFetchResult {
  processed: number;
  total: number;
  errors: number;
  epochRange: {
    start: number;
    end: number;
  };
  errorDetails: { epoch: number; error: string }[];
}

class EpochDataManager {
  private dataDirectory: string;
  private databasePath: string;
  private baseUrl: string;
  private batchSize: number;
  private delay: number;

  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'json');
    this.databasePath = path.join(this.dataDirectory, 'epoch_db.json');
    this.baseUrl = 'https://dev.dashtec.xyz/api/epochs';
    this.batchSize = 50;
    this.delay = 1000;

    this.init()
  }

  // Initialize data directory and database file
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDirectory, { recursive: true });
      
      // Create empty database if it doesn't exist
      try {
        await fs.access(this.databasePath);
      } catch {
        await this.createEmptyDatabase();
      }
    } catch (error) {
      console.error('Error initializing:', error);
      throw error;
    }
  }

  // Create empty database file
  private async createEmptyDatabase(): Promise<void> {
    const emptyDatabase: EpochDatabase = {
      metadata: {
        totalEpochs: 0,
        epochRange: { start: 0, end: 0 },
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      },
      epochs: {}
    };

    await fs.writeFile(this.databasePath, JSON.stringify(emptyDatabase, null, 2));
    console.log('Empty database created');
  }

  // Load database from file
  async loadDatabase(): Promise<EpochDatabase> {
    try {
      const data = await fs.readFile(this.databasePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      // Return empty database if file doesn't exist or is corrupted
      return {
        metadata: {
          totalEpochs: 0,
          epochRange: { start: 0, end: 0 },
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        epochs: {}
      };
    }
  }

  // Save database to file
  async saveDatabase(database: EpochDatabase): Promise<void> {
    try {
      await fs.writeFile(this.databasePath, JSON.stringify(database, null, 2));
      console.log('Database saved successfully');
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  // Fetch single epoch data from API
  async fetchEpochData(epochNumber: number): Promise<RawEpochData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${epochNumber}/live-slot-activity`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching epoch ${epochNumber}:`, error);
      return null;
    }
  }

  // Process and clean epoch data (remove slots)
  private processEpochData(epochData: RawEpochData | null, epochNumber: number): ProcessedEpochData {
    if (!epochData || !epochData.activities) {
      return {
        epoch: epochNumber,
        activities: [],
        timestamp: new Date().toISOString(),
        totalValidators: 0
      };
    }

    const cleanedActivities: CleanValidatorActivity[] = epochData.activities.map(activity => ({
      validatorIndex: activity.validatorIndex,
      validatorAddress: activity.validatorAddress,
      displayName: activity.displayName,
      x_handle: activity.x_handle,
      name: activity.name,
      slotsCount: activity.slots ? activity.slots.length : 0
    }));

    return {
      epoch: epochNumber,
      activities: cleanedActivities,
      timestamp: new Date().toISOString(),
      totalValidators: cleanedActivities.length
    };
  }

  // Clean old epochs (epochs < from) to optimize performance
  private async cleanOldEpochs(database: EpochDatabase, from: number): Promise<number> {
    let removedCount = 0;
    const epochNumbers = Object.keys(database.epochs).map(Number);
    
    for (const epochNumber of epochNumbers) {
      if (epochNumber < from) {
        delete database.epochs[epochNumber];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned ${removedCount} old epochs (< ${from}) to optimize performance`);
    }

    return removedCount;
  }

  // Update database metadata
  private updateMetadata(database: EpochDatabase): void {
    const epochNumbers = Object.keys(database.epochs).map(Number);
    
    if (epochNumbers.length > 0) {
      database.metadata.totalEpochs = epochNumbers.length;
      database.metadata.epochRange.start = Math.min(...epochNumbers);
      database.metadata.epochRange.end = Math.max(...epochNumbers);
    } else {
      database.metadata.totalEpochs = 0;
      database.metadata.epochRange.start = 0;
      database.metadata.epochRange.end = 0;
    }
    
    database.metadata.lastUpdated = new Date().toISOString();
  }

  // Sleep function for rate limiting
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process single epoch
  private async processSingleEpoch(epochNumber: number): Promise<ProcessedEpochData | null> {
    try {
      const rawData = await this.fetchEpochData(epochNumber);
      return this.processEpochData(rawData, epochNumber);
    } catch (error) {
      console.error(`Error processing epoch ${epochNumber}:`, error);
      return null;
    }
  }

  // Fetch and save single epoch
  async fetchSingleEpochAndSave(epoch: number): Promise<{
    success: boolean;
    epochData?: ProcessedEpochData;
    error?: string;
  }> {
    console.log(`Fetching and saving epoch ${epoch}...`);
    
    await this.init();
    const database = await this.loadDatabase();

    try {
      const processedData = await this.processSingleEpoch(epoch);
      
      if (!processedData) {
        return {
          success: false,
          error: 'Failed to fetch or process epoch data'
        };
      }

      // Save epoch to database
      database.epochs[epoch] = processedData;
      
      // Update metadata
      this.updateMetadata(database);
      
      // Save database
      await this.saveDatabase(database);

      console.log(`✅ Successfully saved epoch ${epoch} with ${processedData.totalValidators} validators`);

      return {
        success: true,
        epochData: processedData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching epoch ${epoch}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Fetch and save epochs using Promise.all for maximum speed (no rate limit)
  async fetchBulkAndSave(from: number, to: number): Promise<BulkFetchResult> {
    console.log(`Starting bulk fetch and save epochs from ${from} to ${to} using Promise.all`);
    
    await this.init();
    const database = await this.loadDatabase();
    
    // Clean old epochs (epochs < from) to optimize performance
    const cleanedCount = await this.cleanOldEpochs(database, from);

    const totalCount = to - from + 1;
    const epochNumbers: number[] = [];
    
    // Generate epoch numbers array
    for (let i = from; i <= to; i++) {
      epochNumbers.push(i);
    }

    console.log(`Fetching ${totalCount} epochs simultaneously...`);
    const startTime = Date.now();

    // Fetch all epochs simultaneously using Promise.all
    const allPromises = epochNumbers.map(epochNumber => this.processSingleEpoch(epochNumber));
    const results = await Promise.allSettled(allPromises);

    const endTime = Date.now();
    const fetchDuration = (endTime - startTime) / 1000;

    // Process results
    const errors: { epoch: number; error: string }[] = [];
    let processed = 0;

    results.forEach((result, index) => {
      const epochNumber = epochNumbers[index];
      if (result.status === 'fulfilled' && result.value) {
        database.epochs[epochNumber] = result.value;
        processed++;
      } else {
        errors.push({
          epoch: epochNumber,
          error: 'Unknown error'
        });
      }
    });

    // Update metadata and save database
    this.updateMetadata(database);
    await this.saveDatabase(database);

    const result: BulkFetchResult = {
      processed,
      total: totalCount,
      errors: errors.length,
      epochRange: { start: from, end: to },
      errorDetails: errors
    };

    console.log('\n=== BULK FETCH AND SAVE COMPLETED ===');
    console.log(`Fetch duration: ${fetchDuration.toFixed(2)} seconds`);
    console.log(`Average: ${(fetchDuration / totalCount * 1000).toFixed(0)}ms per epoch`);
    console.log(`Successfully processed: ${processed}/${totalCount} epochs`);
    console.log(`Errors: ${errors.length}`);
    if (cleanedCount > 0) {
      console.log(`Cleaned old epochs: ${cleanedCount}`);
    }
    
    if (errors.length > 0) {
      console.log('Failed epochs:', errors.map(e => e.epoch).join(', '));
    }

    return result;
  }

  // Save epochs in range with optimization (batch processing - slower but safer)
  async saveEpochs(from: number, to: number): Promise<BulkFetchResult> {
    console.log(`Starting to save epochs from ${from} to ${to} using batch processing`);
    
    await this.init();
    const database = await this.loadDatabase();
    
    // Clean old epochs (epochs < from) to optimize performance
    const cleanedCount = await this.cleanOldEpochs(database, from);

    const totalCount = to - from + 1;
    const errors: { epoch: number; error: string }[] = [];
    let processed = 0;

    // Process in batches
    for (let i = 0; i < totalCount; i += this.batchSize) {
      const batchStart = from + i;
      const batchEnd = Math.min(from + i + this.batchSize - 1, to);
      
      console.log(`Processing batch: epochs ${batchStart} to ${batchEnd} (${i + 1}-${Math.min(i + this.batchSize, totalCount)} of ${totalCount})`);

      // Process batch
      const batchPromises: Promise<ProcessedEpochData | null>[] = [];
      for (let epochNumber = batchStart; epochNumber <= batchEnd; epochNumber++) {
        batchPromises.push(this.processSingleEpoch(epochNumber));
      }

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        const epochNumber = batchStart + index;
        if (result.status === 'fulfilled' && result.value) {
          database.epochs[epochNumber] = result.value;
          processed++;
        } else {
          errors.push({
            epoch: epochNumber,
            error: 'Unknown error'
          });
        }
      });

      // Update progress
      const progressPercent = Math.round(((i + this.batchSize) / totalCount) * 100);
      console.log(`Batch completed. Progress: ${Math.min(processed + errors.length, totalCount)}/${totalCount} (${Math.min(progressPercent, 100)}%)`);
      
      // Rate limiting delay between batches
      if (batchEnd < to) {
        await this.sleep(this.delay * this.batchSize);
      }
    }

    // Update metadata and save database
    this.updateMetadata(database);
    await this.saveDatabase(database);

    const result: BulkFetchResult = {
      processed,
      total: totalCount,
      errors: errors.length,
      epochRange: { start: from, end: to },
      errorDetails: errors
    };

    console.log('\n=== SAVE EPOCHS COMPLETED ===');
    console.log(`Successfully processed: ${processed}/${totalCount} epochs`);
    console.log(`Errors: ${errors.length}`);
    if (cleanedCount > 0) {
      console.log(`Cleaned old epochs: ${cleanedCount}`);
    }
    
    if (errors.length > 0) {
      console.log('Failed epochs:', errors.map(e => e.epoch).join(', '));
    }

    return result;
  }

  // Get epoch data by number
  async getEpoch(epochNumber: number): Promise<ProcessedEpochData | null> {
    const database = await this.loadDatabase();
    return database.epochs[epochNumber] || null;
  }

  // Get epochs in range
  async getEpochsInRange(startEpoch: number, endEpoch: number): Promise<ProcessedEpochData[]> {
    const database = await this.loadDatabase();
    const results: ProcessedEpochData[] = [];
    
    for (let i = startEpoch; i <= endEpoch; i++) {
      if (database.epochs[i]) {
        results.push(database.epochs[i]);
      }
    }
    
    return results;
  }

  // Get all available epochs
  async getAllEpochs(): Promise<ProcessedEpochData[]> {
    const database = await this.loadDatabase();
    return Object.values(database.epochs).sort((a, b) => a.epoch - b.epoch);
  }

  // Get validators by epoch
  async getValidatorsByEpoch(epochNumber: number): Promise<CleanValidatorActivity[] | null> {
    const epochData = await this.getEpoch(epochNumber);
    return epochData ? epochData.activities : null;
  }

  // Search validator by address across all epochs
  async searchValidatorByAddress(address: string): Promise<Array<{
    epoch: number;
    validator: CleanValidatorActivity;
    timestamp: string;
  }>> {
    const database = await this.loadDatabase();
    const results: Array<{
      epoch: number;
      validator: CleanValidatorActivity;
      timestamp: string;
    }> = [];

    Object.values(database.epochs).forEach(epochData => {
      const validator = epochData.activities.find(v => v.validatorAddress === address);
      if (validator) {
        results.push({
          epoch: epochData.epoch,
          validator: validator,
          timestamp: epochData.timestamp
        });
      }
    });

    return results.sort((a, b) => a.epoch - b.epoch);
  }

  // Get database statistics
  async getStatistics(): Promise<{
    totalEpochs: number;
    epochRange: { start: number; end: number };
    totalValidators: number;
    uniqueValidators: number;
    lastUpdated: string;
    databaseSizeMB: number;
  }> {
    const database = await this.loadDatabase();
    const stats = await fs.stat(this.databasePath);
    
    // Calculate unique validators
    const uniqueAddresses = new Set<string>();
    let totalValidators = 0;
    
    Object.values(database.epochs).forEach(epochData => {
      totalValidators += epochData.totalValidators;
      epochData.activities.forEach(validator => {
        uniqueAddresses.add(validator.validatorAddress);
      });
    });

    return {
      totalEpochs: database.metadata.totalEpochs,
      epochRange: database.metadata.epochRange,
      totalValidators,
      uniqueValidators: uniqueAddresses.size,
      lastUpdated: database.metadata.lastUpdated,
      databaseSizeMB: Math.round((stats.size / 1024 / 1024) * 100) / 100
    };
  }

  // Clear all data
  async clearDatabase(): Promise<void> {
    await this.createEmptyDatabase();
    console.log('Database cleared');
  }
}

export default EpochDataManager;

const main = async() => {
  const c = new EpochDataManager()
  const x = await c.searchValidatorByAddress("0xffff625d3233a3b436a4b3f44ee1bc8284e4eeee")
}

main()