import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

const evmRegex = /^0x[a-fA-F0-9]{40}$/;
 
export default async function removeValidator(ctx: Context) {
  setTimeout(() => {
    ctx.api.deleteMessage(ctx.chat?.id!, ctx.message?.message_id!);
  }, 5000);

  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length < 2) {
    const msg = await ctx.reply("⚠️ Wrong format.\nExample: `/remove_validator 0x1234...`", {
      parse_mode: "Markdown",
    });

    setTimeout(() => {
      ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
    }, 5000);

    return
  }

  const address = parts[1];

  if (!evmRegex.test(address)) {
    const msg = await ctx.reply("❌ Invalid address. Must be in EVM format (0x + 40 hex chars).");
    setTimeout(() => {
      ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
    }, 5000);
    return
  }

  database.removeValidator(address, ctx.chatId!);

  const msg = await ctx.reply("✅ Validator deleted from watchlist");
  setTimeout(() => {
    ctx.api.deleteMessage(msg.chat?.id!, msg.message_id!);
  }, 5000);
  
}
