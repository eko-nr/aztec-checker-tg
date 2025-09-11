import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";
import { formatValidatorMessage } from "../utils/formatValidator";
import { fetchValidatorData } from "../utils/fetchValidator";
import { fetchQueue } from "../utils/fetchQueue";
import { formatQueue } from "../utils/formatQueue";
import { formatTotalValidatorMessage } from "../utils/formatTotalValidator";

const database = new ValidatorDatabase();

export default async function showValidators(ctx: Context) {
  const validators = await database.getChatValidators(ctx.chatId!);
  
  if (validators.length <= 0) {
    ctx.reply("⚠️ You don't have any validator");
    return;
  }

  // Separate validators that need API calls from those with cached data
  const validatorsWithCache = [];
  const validatorsNeedingFetch = [];

  for (const validator of validators) {
    const latestLogs = await database.getLatestLog(validator.address);
    
    if (latestLogs?.data) {
      validatorsWithCache.push({
        validator,
        cachedData: latestLogs.data,
        timestamp: latestLogs.timestamp
      });
    } else {
      validatorsNeedingFetch.push(validator);
    }
  }

  // Send cached data immediately (no API calls needed)
  let countValidator = 0
  let countQueue = 0;
  let countInactive = 0;
  
  for (const { cachedData, timestamp } of validatorsWithCache) {
    const message = await formatValidatorMessage({currentData: cachedData, previousData: null}, timestamp, countValidator);

    await ctx.reply(message, {
      parse_mode: "Markdown"
    });

    if(cachedData.status !== "Validating"){
      countInactive++;
    }
    countValidator++;
  }

  // Handle validators that need API calls concurrently
  if (validatorsNeedingFetch.length > 0) {
    // Create promises for concurrent API calls
    const fetchPromises = validatorsNeedingFetch.map(async (validator) => {
      try {
        const data = await fetchValidatorData(validator.address);
        
        return {
          validator,
          data,
          success: true,
          error: null
        };
        
      } catch (error) {
        return {
          validator,
          data: null,
          success: false,
          error
        };
      }
    });

    // Execute all API calls concurrently
    const fetchResults = await Promise.all(fetchPromises);

    // Process results and handle fallbacks
    for (const result of fetchResults) {
      const { validator, data, success, error } = result;

      try {
        if (success && data) {
          // Successfully got validator data
          const message = await formatValidatorMessage({currentData: data, previousData: null}, new Date().toISOString(), countValidator);
          await database.addLog(validator.address, ctx.chatId!, data);
          
          await ctx.reply(message, {
            parse_mode: "Markdown"
          });

          if(data.status !== "Validating"){
            countInactive++;
          }

          countValidator++;

        } else {
          // Primary fetch failed, try queue fallback
          try {
            const dataQueue = await fetchQueue(validator.address);
            
            if (dataQueue && dataQueue.validatorsInQueue.length > 0) {
              const message = formatQueue(dataQueue, countQueue);
              await ctx.reply(message, {
                parse_mode: "Markdown"
              });

              countQueue++;
            } else {
              await ctx.reply(
                `❌ Could'nt get data validator \`${validator.address}\``,
                { parse_mode: "Markdown" }
              );

              countInactive++;
            }
            
          } catch (queueError) {
            await ctx.reply(
              `❌ Could'nt get data validator \`${validator.address}\``,
              { parse_mode: "Markdown" }
            );

            countInactive++;
          }
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (processingError) {
        await ctx.reply(
          `❌ **API Error**\n\n` +
          `${typeof processingError === "string" ? processingError : JSON.stringify(processingError)}`,
          { parse_mode: "Markdown" }
        );
      }
    }
  }

   try {
      const messageSummary = formatTotalValidatorMessage({
        activeValidators: validators.length - countInactive - countQueue,
        inactiveValidators: countInactive,
        queueValidators: countQueue,
        totalValidators: validators.length
      });

      await ctx.reply(
        messageSummary,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      
    }
}