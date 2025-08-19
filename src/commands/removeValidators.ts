import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

const evmRegex = /^0x[a-fA-F0-9]{40}$/;
 
export default async function removeValidator(ctx: Context) {
  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length < 2) {
    return ctx.reply("⚠️ Wrong format.\nExample: `/remove_validator 0x1234...`", {
      parse_mode: "Markdown",
    });
  }

  const address = parts[1];

  if (!evmRegex.test(address)) {
    return ctx.reply("❌ Invalid address. Must be in EVM format (0x + 40 hex chars).");
  }

  database.removeValidator(address, ctx.chatId!);

  await ctx.reply("✅ Validator deleted from watchlist")
  
}
