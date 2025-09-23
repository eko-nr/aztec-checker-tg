import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

export const deleteValidator = async(ctx: Context) => {
  try {
    const address = ctx.callbackQuery?.data?.split("_")?.[1];

    if(address){
      database.removeValidator(address, ctx.chatId!);

      await ctx.editMessageText("✅ Validator deleted from watchlist")
    }else{
      await ctx.editMessageText("⚠️ Couldn't delete validator")
    }
  } catch (error) {
    
  }
}