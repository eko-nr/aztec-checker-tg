import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

export default async function listValidators(ctx: Context, edit = false) {
  const validators = await database.getChatValidators(ctx.chatId!);
  const recentLogs = await database.getLatestLogsByChat(ctx.chatId!, validators.length);
  
  try {
    const keyboard = new InlineKeyboard()

    for (const key in validators) {
      const address = validators[key].address;
      const findRecentLogs = recentLogs.find(x => x.address.toLowerCase() === address.toLowerCase());

      const cleanAddress = `${address.substring(0, 5)}...${address.substring(address.length - 5, address.length)}`;
      let message = `${Number(key)+1}. ${cleanAddress}`

      keyboard.text(message, `show_${address}`);
      keyboard.text("❌ Delete", `del_${address}`);

      keyboard.row()
    }

    keyboard.text("⊘ Close", `close`);

    !edit? await ctx.reply("🎯 Here is your validators:", { reply_markup: keyboard }) : await ctx.editMessageText("🎯 Here is your validators:", { reply_markup: keyboard }) 
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
