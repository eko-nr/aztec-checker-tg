// handlers/deleteMessage.ts
import { Context } from "grammy";
import TelegramMessageManager from "../db/telegramMessageManager";

const messageManager = new TelegramMessageManager();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const deleteMessage = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const cbMsgId = ctx.callbackQuery?.message?.message_id;
  const cbData = ctx.callbackQuery?.data ?? "";

  try { await ctx.answerCallbackQuery(); } catch {}

  if (cbMsgId) {
    try {
      await ctx.deleteMessage();
    } catch (e: any) {
      console.log(
        "failed to delete callback msg:",
        cbMsgId,
        e?.description || e?.message || String(e)
      );
    }
  }

  if (!chatId) return;

  if (cbData === "close") {
    return;
  }

  if (cbData !== "close_all_reports") {
    return;
  }

  const rows = await messageManager.getChatMessages(chatId);

  for (const row of rows ?? []) {
    const msgId = Number(row.message_id);

    // Skip the callback message we already deleted
    if (cbMsgId && msgId === cbMsgId) continue;

    try {
      await ctx.api.deleteMessage(chatId, msgId);
      await messageManager.deleteMessage(chatId, msgId);
    } catch (err: any) {
      const desc =
        err?.description || err?.message || JSON.stringify(err, null, 2);

      // Already gone / not deletable -> clean DB and continue
      if (
        desc.includes("message to delete not found") ||
        desc.includes("message can't be deleted") ||
        desc.includes("message can’t be deleted")
      ) {
        await messageManager.deleteMessage(chatId, msgId);
        continue;
      }

      // Rate limited -> wait retry_after once and retry
      if (desc.includes("Too Many Requests") && err.parameters?.retry_after) {
        const waitMs = (err.parameters.retry_after + 1) * 1000;
        await sleep(waitMs);
        try {
          await ctx.api.deleteMessage(chatId, msgId);
          await messageManager.deleteMessage(chatId, msgId);
          continue;
        } catch (e2: any) {
          console.log(
            "retry failed:",
            chatId,
            msgId,
            e2?.description || e2?.message || String(e2)
          );
        }
      }

      console.log("delete failed:", chatId, msgId, desc);
    }

    // Tiny delay to smooth out bursts (helps avoid 429s)
    await sleep(60);
  }
};
