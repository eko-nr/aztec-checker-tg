import { Context } from "grammy";
import showEpochService from "../services/showEpochService";

export default async function epoch(ctx: Context) {
  try {
    setTimeout(() => {
      ctx.api.deleteMessage(ctx.chat?.id!, ctx.message?.message_id!);
    }, 5000);

    await showEpochService(ctx)
  } catch (error) {
    const msg = await ctx.reply("❌ Failed to get epoch, try again later");
    setTimeout(() => {
      ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
    }, 5000);
  }
}
