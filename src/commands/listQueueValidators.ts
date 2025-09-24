import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import listQueueValidatorsService from "../services/listQueueValidatorsService";

const database = new ValidatorDatabase();

export default async function listQueueValidators(ctx: Context) {
  try {
    await listQueueValidatorsService(ctx)
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
