import { Bot } from "grammy";
import startCommand from "./commands/start";
import helpCommand from "./commands/help";
import addValidatorCommand from "./commands/addValidator";
import showValidatorsCommand from "./commands/showValidators";
import messageHandler from "./handlers/messageHandler";
import { startValidatorChecker } from "./jobs/validatorChecker";
import epochCommand from "./commands/epoch";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN not found in environment variables");

const bot = new Bot(token);

// Register commands
bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("add_validator", addValidatorCommand);
bot.command("show_validators", showValidatorsCommand);
bot.command("epoch", epochCommand);

// Message handler
bot.on("message:text", messageHandler);

// Start cronjob (pass bot instance)
startValidatorChecker(bot);

// Start bot
bot.start();
console.log("🤖 Bot is running with hourly cronjob...");
