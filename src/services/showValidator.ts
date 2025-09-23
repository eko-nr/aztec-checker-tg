import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchValidatorData } from "../utils/fetchValidator";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchQueue } from "../utils/fetchQueue";
import { formatQueue } from "../utils/formatQueue";

const database = new ValidatorDatabase();

export const showValidator = async (ctx: Context) => {
  try {
    const address = ctx.callbackQuery?.data?.split("_")?.[1];
    
    if(address){
      const data = await fetchValidatorData(address);
      const dataQueue = await fetchQueue(address);

      if(data){
        const message = await formatValidatorMessage({currentData: data!, previousData: null}, new Date().toISOString());
        ctx.editMessageText(message, {parse_mode: "Markdown"});
      }else if(dataQueue){
        const message = formatQueue(dataQueue);
        await ctx.editMessageText(message, {
          parse_mode: "Markdown"
        });
      }
    }

  } catch (error) {
    console.log('error:', error);
  }
}