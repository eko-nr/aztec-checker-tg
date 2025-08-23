import { ValidatorDatabase } from '../db/validatorDB';

async function main() {
  const database = new ValidatorDatabase();
  
  const clearedCount = await database.purgeAllLogs();
  console.log(`✅ Purged ${clearedCount} logs from the database`);
  
  process.exit(0);
}

main().catch(console.error);