import { Context } from "grammy";
import { handleBroadcastMessage } from "../commands/broadCastMessage";

export default async function messageHandler(ctx: Context) {
  const text = ctx.message?.text;
  const adminId = process.env.ADMIN_ID;

  if(ctx.chatId?.toString() === adminId){
    await handleBroadcastMessage(ctx);
  }

  if (!text) return;
}
