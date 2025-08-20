import { Bot } from "grammy";
import cron from "node-cron";
import { ValidatorDatabase } from "../db/validatorDB";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchValidatorData } from "../utils/fetchValidator";
import { fetchQueue } from "../utils/fetchQueue";
import { formatQueue } from "../utils/formatQueue";

export function startValidatorChecker(bot: Bot) {
  const database = new ValidatorDatabase();

  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ Running validator status checker at", new Date().toISOString());
    
    try {
      const validators = await database.getValidators();
      
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
            const hasChanged = database.hasDataChanged(latestLog?.data || null, data);
            
            // Always save to database
            await database.addLog(validator.address, validator.chatId, data);
            
            // Only send message if data has changed
            if (hasChanged) {
              const message = formatValidatorMessage(data, new Date().toISOString());
              
              await bot.api.sendMessage(validator.chatId, message, {
                parse_mode: "Markdown"
              });
            }
            
          } else if (!success) {
            // Send error notification
            await bot.api.sendMessage(
              validator.chatId,
              `⚠️ **Processing Error**\n\n` +
              `Error occurred while processing validator \`${validator.address}\`.\n` +
              `Will retry in the next cycle.`,
              { parse_mode: "Markdown" }
            );
          }

          // Optional: Add small delay between message sends to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (processingError) {
          console.error(`💥 Error processing result for validator ${validator.address}:`, processingError);
          
          try {
            await bot.api.sendMessage(
              validator.chatId,
              `⚠️ **Processing Error**\n\n` +
              `Error occurred while processing validator \`${validator.address}\`.\n` +
              `Will retry in the next cycle.`,
              { parse_mode: "Markdown" }
            );
          } catch (sendError) {
            console.error(`Failed to send error notification to chat ${validator.chatId}:`, sendError);
          }
        }
      }

      console.log(`✅ Validator status check completed at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error("💥 Critical error in validator checker cron job:", error);
    }
  });

  console.log("🚀 Validator status checker initialized");
  const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds
  const nextRunTime = new Date(Math.ceil(Date.now() / THIRTY_MINUTES) * THIRTY_MINUTES);
  console.log(`📅 Next run: ${nextRunTime.toLocaleString()}`);
}