import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { fetchValidatorData } from "../utils/fetchValidator";

// Regex to validate an EVM address
const evmRegex = /^0x[a-fA-F0-9]{40}$/;

const database = new ValidatorDatabase();

export default async function addValidatorCommand(ctx: Context) {
  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length < 2) {
    return ctx.reply("⚠️ Wrong format.\nExample: `/add_validator 0x1234...`", {
      parse_mode: "Markdown",
    });
  }

  const address = parts[1];

  if (!evmRegex.test(address)) {
    return ctx.reply("❌ Invalid address. Must be in EVM format (0x + 40 hex chars).");
  }

  try {
    // Add validator to database
    const added = await database.addValidator(address, ctx.chat!.id);
    
    if (added) {
      ctx.reply(
        `✅ Validator added!\n\n` +
        `🔔 You will receive status updates for this validator.`,
        {
          parse_mode: "Markdown",
        }
      );
      
      const data = await fetchValidatorData(address);
      data && await database.addLog(address, ctx.chatId!, data);
      
    } else {
      return ctx.reply(
        `⚠️ Validator already exists!\n\n` +
        `The validator \`${address}\` is already being monitored.`,
        {
          parse_mode: "Markdown",
        }
      );
    }
  } catch (error) {
    console.error("Error adding validator:", error);
    return ctx.reply("❌ Failed to add validator. Please try again later.");
  }
}