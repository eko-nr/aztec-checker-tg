import { Bot } from "grammy";
import startCommand from "./commands/start";
import helpCommand from "./commands/help";
import addValidatorCommand from "./commands/addValidator";
import showValidatorsCommand from "./commands/showValidators";
import messageHandler from "./handlers/messageHandler";
import { startValidatorChecker } from "./jobs/validatorChecker";
import epochCommand from "./commands/epoch";
import removeValidatorCommand from "./commands/removeValidators";
import getEpochValidatorCommand from "./commands/getEpochValidator";
import broadCastMessageCommand from "./commands/broadCastMessage";
import listValidatorsCommand from "./commands/listValidators";
import listQueueValidatorsCommand from "./commands/listQueueValidators";
import callbackHandler from "./handlers/callbackHandler";
import { startEpochFetcher } from "./jobs/epochFetcher";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN not found in environment variables");

const bot = new Bot(token);

// Register commands
bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("add_validator", addValidatorCommand);
bot.command("remove_validator", removeValidatorCommand);
bot.command("show_validators", showValidatorsCommand);
bot.command("epoch", epochCommand);
bot.command("get_epoch_validator", getEpochValidatorCommand);
bot.command("broadcast", broadCastMessageCommand);
bot.command("list_validators", (ctx) => listValidatorsCommand(ctx));
bot.command("list_queue_validators", (ctx) => listQueueValidatorsCommand(ctx));

// handler
bot.on("message:text", messageHandler);
bot.on("callback_query:data", callbackHandler);

// Start cronjob (pass bot instance)
startValidatorChecker(bot);
startEpochFetcher(bot);

// Start bot
bot.start();
console.log("🤖 Bot is running with cronjob...");
