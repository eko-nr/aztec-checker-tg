import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchValidatorData } from "../utils/fetchValidator";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchQueue } from "../utils/fetchQueue";
import { formatQueue } from "../utils/formatQueue";
import { fetchEpoch } from "../utils/fetchEpoch";
import EpochDataManager from "../db/epochManager";

const database = new ValidatorDatabase();
const epochManager = new EpochDataManager()

export const showValidator = async (ctx: Context) => {
  try {
    const address = ctx.callbackQuery?.data?.split("_")?.[1];

    if(address){
      const wait = ctx.reply("🫣 Just a moment...");
      setTimeout(async() => {
        ctx.api.deleteMessage((await wait).chat.id, (await wait).message_id);
      }, 3500);

      const data = await fetchValidatorData(address);
      const dataQueue = await fetchQueue(address);
      const currentEpoch = await fetchEpoch();

      if(data){
        const keyboard = new InlineKeyboard();
        keyboard.text("✖ Close", "close")
        keyboard.text("🔙 Back", `list_validator`);

        const message = await formatValidatorMessage(
          {
            currentData: data,
            previousData: null
          },
          new Date().toISOString(),
          {
            currentEpoch: currentEpoch?.currentEpochMetrics.epochNumber || 0,
            epochs: await epochManager.searchValidatorByAddress(data.address)
          },
        );
        const msg = await ctx.editMessageText(
          message,
          {
            parse_mode: "Markdown",
            reply_markup: keyboard
          }
        );
      }else if(dataQueue){
        const message = formatQueue(dataQueue);
        const keyboard = new InlineKeyboard();

        keyboard.text("✖ Close", "close")
        keyboard.text("🔙 Back", `list_queue_validator`);

        const msg = await ctx.editMessageText(message, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });
      }
    }

  } catch (error) {
    console.log('error:', error);
  }
}