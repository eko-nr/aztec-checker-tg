import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";
import { ValidatorDatabase } from "../db/validatorDB";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchValidatorData } from "../utils/fetchValidator";
import { fetchEpoch } from "../utils/fetchEpoch";
import { fethEpochValidator } from "../utils/fetchEpochValidator";
import { formatEpochValidator } from "../utils/formatEpoch";
import EpochDataManager from "../db/epochManager";
import TelegramMessageManager from "../db/telegramMessageManager";

const database = new ValidatorDatabase();
const epochManager = new EpochDataManager()
const messageManager = new TelegramMessageManager();

export async function startValidatorChecker(bot: Bot) {

  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Running validator status checker at", new Date().toISOString());
    
    try {
      const validators = await database.getValidators();
      const currentEpoch = await fetchEpoch()
      
      if (validators.length === 0) {
        console.log("📭 No validators registered for monitoring");
        return;
      }

      console.log(`🔍 Checking status for ${validators.length} validators...`);

      // Create array of promises for concurrent API calls
      const validatorPromises = validators.map(async (validator) => {
        try {
          console.log(`📡 Fetching data for validator: ${validator.address}`);
          
          const data = await fetchValidatorData(validator.address);
          
          return {
            validator,
            data,
            success: true,
            error: null
          };
          
        } catch (error) {
          console.error(`💥 Error fetching data for validator ${validator.address}:`, error);
          
          return {
            validator,
            data: null,
            success: false,
            error
          };
        }
      });

      // Execute all API calls concurrently
      const results = await Promise.all(validatorPromises);

      // Process results sequentially for database operations and messaging
      for (const result of results) {
        const { validator, data, success, error } = result;
        try {
          if (success && data) {
            // Get the latest log to compare data
            const latestLog = await database.getLatestLog(validator.address);
            const hasChanged = await database.hasDataChanged(latestLog?.data || null, data, false);
            const prevValidator = await database.getValidatorData(validator.address);

            if(data?.status === "inactive_on_contract"){
              continue;
            }

            if(Number(data.balance) > 0 && (Number(data.unclaimedRewards) - Number(prevValidator?.unclaimedRewards ?? 0)) < 0){
              continue;
            }

            const message = formatValidatorMessage(
              {
                currentData: data,
                previousData: prevValidator
              },
              new Date().toISOString(),
              {
                currentEpoch: currentEpoch?.currentEpochMetrics.epochNumber || 0,
                epochs: await epochManager.searchValidatorByAddress(data.address)
              },
            );
            
            // Save logs to database
            await database.addLog(validator.address, validator.chatId, data);
            
            // Only send message if data has changed
            if (hasChanged) {
              
              const keyboard = new InlineKeyboard();
              keyboard.text("✖ Close All Reports", "close_all_report")
              
              const msg = await bot.api.sendMessage(validator.chatId, message, {
                parse_mode: "Markdown",
                reply_markup: keyboard
              });

              messageManager.addMessage(validator.chatId, msg.message_id, "VALIDATOR_REPORT")
            }
            
          } else if (!success) {
            // Send error notification
            const msg = await bot.api.sendMessage(
              validator.chatId,
              `⚠️ **Processing Error**\n\n` +
              `Error occurred while processing validator \`${validator.address}\`.\n` +
              `Will retry in the next cycle.`,
              { parse_mode: "Markdown" }
            );

            setTimeout(() => {
              bot.api.deleteMessage(msg.chat?.id!, msg.message_id!);
            }, 15000);
          }

          // Optional: Add small delay between message sends to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (processingError) {
          console.error(`💥 Error processing result for validator ${validator.address}:`, processingError);
          
          try {
            const msg = await bot.api.sendMessage(
              validator.chatId,
              `⚠️ **Processing Error**\n\n` +
              `Error occurred while processing validator \`${validator.address}\`.\n` +
              `Will retry in the next cycle.`,
              { parse_mode: "Markdown" }
            );

            setTimeout(() => {
              bot.api.deleteMessage(msg.chat?.id!, msg.message_id!);
            }, 15000);
          } catch (sendError) {
            console.error(`Failed to send error notification to chat ${validator.chatId}:`, sendError);
          }
        }
      }

      console.log(`✅ Validator status check completed at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error("💥 Critical error in validator checker cron job:", error);
    }

    console.log("🚀 Validator status checker initialized");
  });

  cron.schedule("*/2 * * * *", async () => {
    const validators = await database.getValidators();
    const currentEpoch = await fetchEpoch();

    if(currentEpoch){
      const epochValidator = await fethEpochValidator(currentEpoch.currentEpochMetrics.epochNumber);
      if(epochValidator){
        for (const validator of validators) {
          const message = formatEpochValidator(epochValidator, validator.address);
          if(message){
            const keyboard = new InlineKeyboard();
            keyboard.text("✖ Close All Reports", "close_all_report")

            const msg = await bot.api.sendMessage(
              validator.chatId,
              message,
              {
                parse_mode: "Markdown",
                reply_markup: keyboard
              }
            );

            messageManager.addMessage(validator.chatId, msg.message_id, "EPOCH_REPORT")
          }
        }
      }
    }
  });
}