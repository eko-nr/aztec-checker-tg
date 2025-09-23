import { Bot } from "grammy";
import cron from "node-cron";
import EpochDataManager from "../db/epochManager";
import { fetchEpoch } from "../utils/fetchEpoch";

const totalSavingFutureEpoch = 1080

export async function startEpochFetcher(bot: Bot) {
  const epochManager = new EpochDataManager();

  cron.schedule("*/20 * * * *", async () => {
    const currentEpoch = await fetchEpoch();

    if(currentEpoch){
      const nextEpochNumber = currentEpoch?.currentEpochMetrics.epochNumber + 1;
      const epochManagerStats = await epochManager.getStatistics()
      
      if(epochManagerStats.epochRange.start === 0){
        await epochManager.fetchBulkAndSave(nextEpochNumber, nextEpochNumber+totalSavingFutureEpoch);
      }else{
        await epochManager.fetchSingleEpochAndSave(nextEpochNumber+totalSavingFutureEpoch)        
      }
    }

  });
}