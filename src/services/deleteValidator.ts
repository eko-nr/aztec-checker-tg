import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

export const deleteValidator = async(ctx: Context) => {
  try {
    const data = ctx.callbackQuery?.data    
    const isConfirmed = data?.includes("confirmed")
    const address = data?.split("_")?.[1]

    if(isConfirmed){
      const addrConfrimed = data?.split("_")?.[2]
      if(addrConfrimed){
        database.removeValidator(addrConfrimed, ctx.chatId!);
  
        await ctx.editMessageText("✅ Validator deleted from watchlist")
      }else{
        await ctx.editMessageText("⚠️ Couldn't delete validator")
      }
    }else{
      const keyboard = new InlineKeyboard();
      keyboard.text("Confirm", `del_confirmed_${address}`);
      keyboard.text("🔙 Back", `list_validator`);

      await ctx.editMessageText(`⚠️ Continue to delete validator ${address}?`, { reply_markup: keyboard });
    }

  } catch (error) {
    
  }
}