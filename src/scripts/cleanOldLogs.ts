import { ValidatorDatabase } from '../db/validatorDB';

async function main() {
  const database = new ValidatorDatabase();
  
  const clearedCount = await database.clearLogsKeepLatest();
  console.log(`✅ Purged ${clearedCount.totalCleared} logs from the database`);
  
  process.exit(0);
}

main().catch(console.error);