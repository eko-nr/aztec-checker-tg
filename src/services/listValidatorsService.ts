import { Context, InlineKeyboard } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { weiToEther } from "../utils/weiToEther";
import { fetchEpoch } from "../utils/fetchEpoch";

const database = new ValidatorDatabase();

export default async function listValidatorsService(ctx: Context, edit = false) {

  const wait = ctx.reply("🫣 Just a moment...");
  setTimeout(async() => {
    ctx.api.deleteMessage((await wait).chat.id, (await wait).message_id);
  }, 1500);
  
  const validators = await database.getChatValidators(ctx.chatId!);
  const recentLogs = await database.getLatestLogsByChat(ctx.chatId!, validators.length+100);
  const currentEpoch = await fetchEpoch();
  
  const pagination = ctx.callbackQuery?.data?.split("_page_");
  const startFrom = Number(pagination?.[1]) || 0 as number;
  const dataPerPage = 10;

  try {
    const keyboard = new InlineKeyboard();

    let count = 0;
    
    const validatorsWithLogs = validators.filter(validator => {
      const address = validator.address;
      return recentLogs.find(x => x.address.toLowerCase() === address.toLowerCase());
    });

    for (const key in validatorsWithLogs) {
      const address = validatorsWithLogs[key].address;
      const findRecentLogs = recentLogs.find(x => x.address.toLowerCase() === address.toLowerCase());

      const cleanAddress = `${address.substring(0, 5)}...${address.substring(address.length - 5, address.length)}`;

      if (!pagination && Number(key) < dataPerPage) {
        if (findRecentLogs) {
          let message = `${count + 1}. ${cleanAddress}`;
          keyboard.text(message, `show_${address}`);
          keyboard.row();

          keyboard.text(`Balance: ${weiToEther(findRecentLogs.data.balance)} STK`, "null");
          keyboard.text(`Rewards: ${weiToEther(findRecentLogs.data.unclaimedRewards)} STK`, "null");
          keyboard.row();

          let attestation = `Attestation: ${findRecentLogs?.data.totalAttestationsSucceeded} ✅  / ${findRecentLogs?.data.totalAttestationsMissed} ❌  `;
          keyboard.text(attestation, "null");

          const block = `Block: ${findRecentLogs.data.totalBlocksMined + findRecentLogs.data.totalBlocksProposed} ✅ / ${findRecentLogs.data.totalBlocksMissed} ❌`;
          keyboard.text(block, "null");
          keyboard.row();

          const participation = `Participation Epoch: ${findRecentLogs.data.totalParticipatingEpochs}/${currentEpoch?.currentEpochMetrics.epochNumber}`;
          keyboard.text(participation, "null");
          keyboard.row();

          keyboard.text("❌ Delete", `del_${address}`);
          keyboard.text("👀 Show", `show_${address}`);

          keyboard.row();
          keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
          keyboard.row();

          count++;
        }
      }

      if (pagination) {
        if (Number(key) >= startFrom && count < dataPerPage) {
          if (findRecentLogs) {
          let message = `${startFrom + count + 1}. ${cleanAddress}`;
            keyboard.text(message, `show_${address}`);
            keyboard.row();

            keyboard.text(`Balance: ${weiToEther(findRecentLogs.data.balance)} STK`, "null");
            keyboard.text(`Rewards: ${weiToEther(findRecentLogs.data.unclaimedRewards)} STK`, "null");
            keyboard.row();

            let attestation = `Attestation: ${findRecentLogs?.data.totalAttestationsSucceeded} ✅  / ${findRecentLogs?.data.totalAttestationsMissed} ❌  `;
            keyboard.text(attestation, "null");

            const block = `Block: ${findRecentLogs.data.totalBlocksMined + findRecentLogs.data.totalBlocksProposed} ✅ / ${findRecentLogs.data.totalBlocksMissed} ❌`;
            keyboard.text(block, "null");
            keyboard.row();

            const participation = `Participation Epoch: ${findRecentLogs.data.totalParticipatingEpochs}/${currentEpoch?.currentEpochMetrics.epochNumber}`;
            keyboard.text(participation, "null");
            keyboard.row();

            keyboard.text("❌ Delete", `del_${address}`);
            keyboard.text("👀 Show", `show_${address}`);

            keyboard.row();
            keyboard.text("━━━━━━━━━━━━━━━━━━━━", `null`);
            keyboard.row();

            count++;
          }
        }
      }
    }

    const isNoValidators = count <= 0;
    const allPages = Math.ceil(validatorsWithLogs.length / dataPerPage);
    const currentPage = Math.floor(startFrom / dataPerPage) + 1;

    if (pagination && startFrom > 0) {
      keyboard.text(
        `⬅️ Previous (Page ${currentPage - 1} of ${allPages})`,
        `list_validator_page_${startFrom - dataPerPage}`
      );
    }

    if (!isNoValidators && startFrom + dataPerPage < validatorsWithLogs.length) {
      keyboard.text(
        `➡️ Next (Page ${currentPage + 1} of ${allPages})`,
        `list_validator_page_${startFrom + dataPerPage}`
      );
    }

    keyboard.row();
    keyboard.text("✖ Close", `close`);

    const message = isNoValidators ? `🎯 No validators` : `🎯 Here is your validators:`;

    if (!edit) {
      await ctx.reply(message, { reply_markup: keyboard });
    } else {
      await ctx.editMessageText("🎯 Here is your validators:", { reply_markup: keyboard });
    }

  } catch (error) {
    ctx.reply("❌ Failed to get epoch, try again later");
  }
}