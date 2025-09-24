import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchValidatorData } from "../utils/fetchValidator";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchQueue } from "../utils/fetchQueue";
import { formatQueue } from "../utils/formatQueue";
import { fetchEpoch } from "../utils/fetchEpoch";
import EpochDataManager from "../db/epochManager";

const database = new ValidatorDatabase();
const epochManager = new EpochDataManager()

export const showValidator = async (ctx: Context) => {
  try {
    const address = ctx.callbackQuery?.data?.split("_")?.[1];

    if(address){
      const wait = await ctx.reply("🫣 Just a moment...");
      setTimeout(() => {
        ctx.api.deleteMessage(wait.chat.id, wait.message_id);
      }, 3500);

      const data = await fetchValidatorData(address);
      const dataQueue = await fetchQueue(address);
      const currentEpoch = await fetchEpoch();

      if(data){
        const message = await formatValidatorMessage(
          {
            currentData: data,
            previousData: null
          },
          new Date().toISOString(),
          {
            currentEpoch: currentEpoch?.currentEpochMetrics.epochNumber || 0,
            epochs: await epochManager.searchValidatorByAddress(data.address)
          },
        );
        const msg = await ctx.editMessageText(message, {parse_mode: "Markdown"});

        setTimeout(() => {
          if (msg !== true && msg.chat && msg.message_id) {
            ctx.api.deleteMessage(msg.chat.id, msg.message_id);
          }
        }, 120000);
      }else if(dataQueue){
        const message = formatQueue(dataQueue);
        const msg = await ctx.editMessageText(message, {
          parse_mode: "Markdown"
        });

        setTimeout(() => {
          if (msg !== true && msg.chat && msg.message_id) {
            ctx.api.deleteMessage(msg.chat.id, msg.message_id);
          }
        }, 120000);
      }
    }

  } catch (error) {
    console.log('error:', error);
  }
}