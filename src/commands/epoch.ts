import { Context } from "grammy";
import showEpochService from "../services/showEpochService";

export default async function epoch(ctx: Context) {
  try {
    await showEpochService(ctx)
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
