import { Context } from "grammy";
import TelegramMessageManager from "../db/telegramMessageManager";

const messageManager = new TelegramMessageManager();

export const deleteMessage = async (ctx: Context) => {
  try {
    const chatId = ctx.chat?.id;
    const cbMsgId = ctx.callbackQuery?.message?.message_id;
    const cbData = ctx.callbackQuery?.data ?? "";
    const isCloseAll = cbData.split("_")[1] === "all";

    // 1) delete the pressed-button/callback message first (once)
    if (cbMsgId) {
      try { await ctx.deleteMessage(); } catch (e) {
        console.log("failed to delete callback msg:", cbMsgId, (e as any)?.description);
      }
    }
    if (!isCloseAll || !chatId) return;

    // 2) fetch stored messages for THIS chat
    const rows = await messageManager.getChatMessages(chatId);

    for (const row of rows ?? []) {
      const msgId = Number(row.message_id);

      // 3) skip the callback message you just deleted
      if (cbMsgId && msgId === cbMsgId) continue;

      try {
        await ctx.api.deleteMessage(chatId, msgId);
        await messageManager.deleteMessage(chatId, msgId);
      } catch (err: any) {
        const desc = err?.description || String(err);

        // If it's already gone or not deletable, just clean DB and continue
        if (
          desc.includes("message to delete not found") ||
          desc.includes("message can't be deleted") ||
          desc.includes("message can’t be deleted")
        ) {
          await messageManager.deleteMessage(chatId, msgId);
          continue;
        }

        // Rate limit safety: obey retry_after once
        if (desc.includes("Too Many Requests") && err.parameters?.retry_after) {
          const waitMs = (err.parameters.retry_after + 1) * 1000;
          await new Promise(r => setTimeout(r, waitMs));
          try {
            await ctx.api.deleteMessage(chatId, msgId);
            await messageManager.deleteMessage(chatId, msgId);
            continue;
          } catch (e2: any) {
            console.log("retry failed:", chatId, msgId, e2?.description || e2);
          }
        }

        console.log("delete failed:", chatId, msgId, desc);
      }
    }
  } catch (e) {
    console.error("deleteMessage() top-level error", e);
  }
};
