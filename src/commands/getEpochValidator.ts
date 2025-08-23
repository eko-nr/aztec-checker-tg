import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchEpoch } from "../utils/fetchEpoch";
import { fethEpochValidator } from "../utils/fetchEpochValidator";
import { formatEpochValidator } from "../utils/formatEpoch";

const database = new ValidatorDatabase();

export default async function getEpochValidator(ctx: Context) {
  try {
    const validators = await database.getChatValidators(ctx.chatId!);
    const currentEpoch = await fetchEpoch();
    let countValidator = 0;
    
    if(currentEpoch){
      const epochValidator = await fethEpochValidator(currentEpoch.currentEpochMetrics.epochNumber);
      if(epochValidator){
        for (const validator of validators) {
          const message = formatEpochValidator(epochValidator, validator.address);
          if(message){
            await ctx.reply(message, {parse_mode: "Markdown"});

            countValidator++;
          }
        }
      }
    }

    if(countValidator <= 0){
      ctx.reply("Your validators has no epoch.")
    }

  } catch (error) {
    console.log(error)
    ctx.reply("❌ Failed to get epoch validator, try again later")
  }
}
