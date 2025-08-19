import { Context } from "grammy";

export default function helpCommand(ctx: Context) {
  ctx.reply("📖 Command list:\n/start - start the bot\n/help - show help\n/add_validator <address> - add validator address");
}
