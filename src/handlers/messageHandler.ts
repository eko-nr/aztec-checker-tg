import { Context } from "grammy";
import { handleBroadcastMessage } from "../commands/broadCastMessage";

export default async function messageHandler(ctx: Context) {
  const text = ctx.message?.text;

  await handleBroadcastMessage(ctx);

  if (!text) return;

  if (text.toLowerCase().includes("hello")) {
    ctx.reply("Hey there 👋");
  }
}
