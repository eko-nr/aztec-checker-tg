import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { weiToEther } from "../utils/weiToEther";
import { fetchEpoch } from "../utils/fetchEpoch";

const database = new ValidatorDatabase();

export default async function listValidators(ctx: Context, edit = false) {
  const validators = await database.getChatValidators(ctx.chatId!);
  const recentLogs = await database.getLatestLogsByChat(ctx.chatId!, validators.length);
  const currentEpoch = await fetchEpoch()
  
  try {
    const keyboard = new InlineKeyboard()

    let count = 0;
    for (const key in validators) {
      const address = validators[key].address;
      const findRecentLogs = recentLogs.find(x => x.address.toLowerCase() === address.toLowerCase());

      const cleanAddress = `${address.substring(0, 5)}...${address.substring(address.length - 5, address.length)}`;
      
      if(findRecentLogs){
        let message = `${count+1}. ${cleanAddress}`
        keyboard.text(message, `show_${address}`);
        keyboard.row()

        keyboard.text(`Balance: ${weiToEther(findRecentLogs.data.balance)} STK`, "null");
        keyboard.text(`Unclaimed: ${weiToEther(findRecentLogs.data.unclaimedRewards)} STK`, "null")
        keyboard.row();

        let attestation = `Attestation: ${findRecentLogs?.data.totalAttestationsSucceeded} ✅  / ${findRecentLogs?.data.totalAttestationsMissed} ❌  `
        keyboard.text(attestation, "null");
        
        const block = `Block: ${findRecentLogs.data.totalBlocksMined + findRecentLogs.data.totalBlocksProposed} ✅ / ${findRecentLogs.data.totalBlocksMissed} ❌`
        keyboard.text(block, "null");
        keyboard.row()
        
        const participation = `Participation Epoch: ${findRecentLogs.data.totalParticipatingEpochs}/${currentEpoch?.currentEpochMetrics.epochNumber}`
        keyboard.text(participation, "null");
        keyboard.row()
        
        keyboard.text("❌ Delete", `del_${address}`);
        keyboard.text("👀 Show", `show_${address}`);
        
        keyboard.row()
        keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
        keyboard.row()

        count++
      }
    }

    const isNoValidators = count <= 0;

    if(!isNoValidators){
      keyboard.text("⬅️ Previous", `close`);
      keyboard.text("➡️ Next", `close`);
      keyboard.row()
    }

    keyboard.text("✖ Close", `close`);

    const message = isNoValidators ? `🎯 No validators` : `🎯 Here is your validators:`
    !edit? await ctx.reply(message, { reply_markup: keyboard }) : await ctx.editMessageText("🎯 Here is your validators:", { reply_markup: keyboard }) 
  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later")
  }
}
