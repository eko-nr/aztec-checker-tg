import { Context, InlineKeyboard } from "grammy";
import listValidatorsService from "../services/listValidatorsService";


export default async function listValidators(ctx: Context) {
  try {
    setTimeout(() => {
      ctx.api.deleteMessage(ctx.chat?.id!, ctx.message?.message_id!);
    }, 5000);

    listValidatorsService(ctx)
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
