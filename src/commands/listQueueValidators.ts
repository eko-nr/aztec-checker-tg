import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

export default async function listQueueValidators(ctx: Context, edit = false) {
  const validators = await database.getChatValidators(ctx.chatId!);
  const recentLogs = await database.getLatestLogsByChat(ctx.chatId!, validators.length);
  
  try {
    const keyboard = new InlineKeyboard()

    let count = 0;
    for (const key in validators) {
      const address = validators[key].address;
      const findRecentLogs = recentLogs.find(x => x.address.toLowerCase() === address.toLowerCase());

      const cleanAddress = `${address.substring(0, 5)}...${address.substring(address.length - 5, address.length)}`;
      
      if(!findRecentLogs){
        let message = `${count+1}. ${cleanAddress}`
        keyboard.text(message, `show_${address}`);
        keyboard.row()
        
        keyboard.text("❌ Delete", `del_q_${address}`);
        keyboard.text("👀 Show", `show_${address}`);
        keyboard.row()

        keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
        keyboard.row()

        count++
      }
      keyboard.text("✖ Close", `close`);
    }


    !edit? await ctx.reply("🎯 Here is your queue validators:", { reply_markup: keyboard }) : await ctx.editMessageText("🎯 Here is your validators:", { reply_markup: keyboard }) 
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
