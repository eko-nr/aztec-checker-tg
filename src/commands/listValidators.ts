import { Context, InlineKeyboard } from "grammy";
import listValidatorsService from "../services/listValidatorsService";


export default async function listValidators(ctx: Context) {
  try {
    listValidatorsService(ctx)
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
