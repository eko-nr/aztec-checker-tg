import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchEpoch } from "../utils/fetchEpoch";
import { fethEpochValidator } from "../utils/fetchEpochValidator";
import { formatEpochValidator } from "../utils/formatEpoch";

const database = new ValidatorDatabase();

export default async function getEpochValidator(ctx: Context) {
  try {
    setTimeout(() => {
      ctx.api.deleteMessage(ctx.chat?.id!, ctx.message?.message_id!);
    }, 5000);

    const validators = await database.getChatValidators(ctx.chatId!);
    const currentEpoch = await fetchEpoch();
    let countValidator = 0;
    
    if(currentEpoch){
      const epochValidator = await fethEpochValidator(currentEpoch.currentEpochMetrics.epochNumber);
      if(epochValidator){
        for (const validator of validators) {
          const message = formatEpochValidator(epochValidator, validator.address);

          
          if(message){
            const msg = await ctx.reply(message, {parse_mode: "Markdown"});
            setTimeout(() => {
              ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
            }, 60000);

            countValidator++;
          }
        }
      }
    }

    if(countValidator <= 0){
      const msg = await ctx.reply("Your validators has no epoch.")
      setTimeout(() => {
        ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
      }, 6000);
    }

  } catch (error) {
    console.log(error)
    ctx.reply("❌ Failed to get epoch validator, try again later")
  }
}
