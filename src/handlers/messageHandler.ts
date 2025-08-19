import { Context } from "grammy";

export default function messageHandler(ctx: Context) {
  const text = ctx.message?.text;

  if (!text) return;

  if (text.toLowerCase().includes("hello")) {
    ctx.reply("Hey there 👋");
  }
}
