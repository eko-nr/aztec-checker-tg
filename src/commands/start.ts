import { Context } from "grammy";

export default function startCommand(ctx: Context) {
  ctx.reply("👋 Hello! Bun + TypeScript bot is running!");
}
