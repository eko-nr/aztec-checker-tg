import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchValidatorData } from "../utils/fetchValidator";
 const database = new ValidatorDatabase();

export default async function showValidators(ctx: Context) {
  const validators = await database.getChatValidators(ctx.chatId!);

  if(validators.length <= 0){
    ctx.reply("⚠️ You don't have any validator")
  }

  for (const validator of validators) {
    const latestLogs = await database.getLatestLog(validator.address);

    if(latestLogs?.data){
      const message = formatValidatorMessage(latestLogs?.data, latestLogs.timestamp);
  
      await ctx.reply(message, {
        parse_mode: "Markdown"
      })
    }else{
      try {
        const data = await fetchValidatorData(validator.address);

        if (data) {
          const message = formatValidatorMessage(data, new Date().toISOString());
          await database.addLog(validator.address, ctx.chatId!, data);
            
          await ctx.reply(message, {
            parse_mode: "Markdown"
          })
        }else {
          await ctx.reply(
          `❌ Could'nt get data validator ${validator.address}`,
            { parse_mode: "Markdown" }
          );
        }
      } catch (error) {
        await ctx.reply(
          `❌ **API Error**\n\n` +
          `${typeof error === "string" ? error : JSON.stringify(error)}`,
          { parse_mode: "Markdown" }
        );
      }
          
    }
  }
  
}
