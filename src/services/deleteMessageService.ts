import { Context } from "grammy";
import TelegramMessageManager from "../db/telegramMessageManager";

const messageManager = new TelegramMessageManager();

export const deleteMessage = async (ctx: Context) => {
  try {
    const cbData = ctx.callbackQuery?.data;
    const isCloseAll = cbData?.split("_")?.[1] === "all";
    await ctx.deleteMessage()
    
    if(isCloseAll){
      const chats = await messageManager.getChatMessages(ctx.chat?.id!);
      
      for (const chat of chats || []) {
        try {
          await ctx.api.deleteMessage(ctx.chat?.id!, chat.message_id);
          
          await messageManager.deleteMessage(ctx.chat?.id!, chat.message_id)
        } catch (error) {
          await ctx.deleteMessage().catch();
          
          await messageManager.deleteMessage(ctx.chat?.id!, chat.message_id)
          console.log('error delete messages: ', ctx.chat?.id!, "id: ", chat.message_id);
        }
      }
    }

  } catch (error) {
    
  }
}