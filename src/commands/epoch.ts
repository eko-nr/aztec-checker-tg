import { Context } from "grammy";
import { fetchEpoch } from "../utils/fetchEpoch";
import { formatEpoch } from "../utils/formatEpoch";

export default async function epoch(ctx: Context) {
  try {
    const data = await fetchEpoch();

    if(data){
      const message = formatEpoch(data)

      ctx.reply(message, {
        parse_mode: "Markdown"
      })
    }
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
