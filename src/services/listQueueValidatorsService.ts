import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const database = new ValidatorDatabase();

export default async function listQueueValidatorsService(ctx: Context, edit = false) {
  const validators = await database.getChatValidators(ctx.chatId!);
  const recentLogs = await database.getLatestLogsByChat(ctx.chatId!, validators.length);
  const pagination = ctx.callbackQuery?.data?.split("_page_");
  const startFrom = Number(pagination?.[1]) || 0 as number;
  const dataPerPage = 5;
  
  try {
    const keyboard = new InlineKeyboard()

    let count = 0;
    const queueValidators = validators.filter(x => !recentLogs.find(y => x.address.toLowerCase() === y.address.toLowerCase()));

    for (const key in queueValidators) {
      const address = queueValidators[key].address;
      const cleanAddress = `${address.substring(0, 5)}...${address.substring(address.length - 5, address.length)}`;

      if(!pagination && Number(key)+1 <= dataPerPage){
        let message = `${Number(key)+1}. ${cleanAddress}`
        keyboard.text(message, `show_${address}`);
        keyboard.row()
        
        keyboard.text("❌ Delete", `del_q_${address}`);
        keyboard.text("👀 Show", `show_${address}`);
        keyboard.row()
        keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
        keyboard.row()

        count++
      }

      if(pagination){
        if(Number(key)+1 >= Number(startFrom) && count < dataPerPage){
          let message = `${Number(key)+1}. ${cleanAddress}`
          keyboard.text(message, `show_${address}`);
          keyboard.row()
          
          keyboard.text("❌ Delete", `del_q_${address}`);
          keyboard.text("👀 Show", `show_${address}`);
          keyboard.row()
          keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
          keyboard.row()
  
          count++
        }
      }

    }

    const isNoValidators = count <= 0;
    const allPages = Math.ceil(queueValidators.length / dataPerPage);
    const currentPage = Math.floor(startFrom / dataPerPage) + 1;

    if (pagination && startFrom > 0) {
      keyboard.text(
        `⬅️ Previous (Page ${currentPage - 1} of ${allPages})`,
        `list_queue_validator_page_${startFrom - dataPerPage}`
      );
    }

    if (!isNoValidators && startFrom + dataPerPage < queueValidators.length) {
      keyboard.text(
        `➡️ Next (Page ${currentPage + 1} of ${allPages})`,
        `list_queue_validator_page_${startFrom + dataPerPage}`
      );
    }

    keyboard.row()

    keyboard.text("✖ Close", `close`);

    const message = isNoValidators ? `🎯 No queue validators` : `🎯 Here is your queue validators:`;

    if(!edit){
      await ctx.reply(message, { reply_markup: keyboard })
    }else{
      const wait = await ctx.reply("🫣 Just a moment...");
      setTimeout(() => {
        ctx.api.deleteMessage(wait.chat.id, wait.message_id);
      }, 800);

      await ctx.editMessageText("🎯 Here is your validators:", { reply_markup: keyboard }) 
    }
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
