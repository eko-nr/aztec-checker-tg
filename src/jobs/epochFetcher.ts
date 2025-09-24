import { Bot } from "grammy";
import cron from "node-cron";
import EpochDataManager from "../db/epochManager";
import { fetchEpoch } from "../utils/fetchEpoch";

const totalSavingFutureEpoch = 250;

export async function startEpochFetcher(bot: Bot) {
  const epochManager = new EpochDataManager();

  cron.schedule("*/20 * * * *", async () => {
    const currentEpoch = await fetchEpoch();

    if(currentEpoch){
      const nextEpochNumber = currentEpoch?.currentEpochMetrics.epochNumber + 1;
      
      await epochManager.fetchBulkAndSave(nextEpochNumber, nextEpochNumber+totalSavingFutureEpoch);
    }

  });
}