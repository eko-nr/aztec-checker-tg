import { Context, InlineKeyboard } from "grammy";
import { fetchEpoch } from "../utils/fetchEpoch";
import { formatEpoch } from "../utils/formatEpoch";

export default async function showEpochService(ctx: Context, edit = false) {
  try {
    const wait = await ctx.reply("🫣 Just a moment...");
    setTimeout(() => {
      ctx.api.deleteMessage(wait.chat.id, wait.message_id);
    }, 1200);

    const data = await fetchEpoch();
    const keyboard = new InlineKeyboard();

    keyboard.text("✖ Close", "close")
    keyboard.text("🔄 Refresh", "epoch")

    if(data){
      const message = formatEpoch(data)

      if(!edit){
        ctx.reply(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        })
      }else{

        ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        })
      }
    }
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
