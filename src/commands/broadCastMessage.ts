import { Context } from "grammy";
import { ValidatorDatabase } from "../db/validatorDB";

const broadcastStates = new Map<number, { waitingForMessage: boolean }>();

const db = new ValidatorDatabase();

export default async function broadcastCommand(ctx: Context) {
  try {
    // Check if user has permission to broadcast (admin check from .env)
    const userId = ctx.from?.id;
    const adminId = process.env.ADMIN_ID;
    
    if (!userId || !adminId || userId.toString() !== adminId) {
      return ctx.reply("❌ You don't have permission to use this command.");
    }

    // Set user state to waiting for broadcast message
    broadcastStates.set(userId, { waitingForMessage: true });
    
    return ctx.reply("📝 Please send the message you want to broadcast to all validator chats:\n\n(Send any message in the next response and it will be broadcasted)");

  } catch (error) {
    console.error('Broadcast command error:', error);
    await ctx.reply("❌ An error occurred while processing the broadcast command.");
  }
}

// Handler for processing broadcast messages
export async function handleBroadcastMessage(ctx: Context) {
  try {
    const userId = ctx.from?.id;
    const adminId = process.env.ADMIN_ID;
    
    if (!userId || !adminId || userId.toString() !== adminId) {
      return; // Not an admin, ignore
    }

    // Check if user is in broadcast state
    const userState = broadcastStates.get(userId);
    if (!userState?.waitingForMessage) {
      return; // User is not waiting for broadcast message
    }

    // Clear the broadcast state
    broadcastStates.delete(userId);

    const messageText = ctx.message?.text;
    
    if (!messageText || messageText.trim() === '') {
      return ctx.reply("❌ Empty message received. Broadcast cancelled.");
    }
    
    // Get all unique chat IDs that have validators
    const validators = await db.getValidators();
    const uniqueChatIds = [...new Set(validators.map(v => v.chatId))];
    
    if (uniqueChatIds.length === 0) {
      return ctx.reply("📭 No chat IDs found with registered validators.");
    }

    await ctx.reply(`📡 Starting broadcast to ${uniqueChatIds.length} chat(s)...`);

    let successCount = 0;
    let failCount = 0;
    const failedChats: number[] = [];

    // Send message to each chat
    for (const chatId of uniqueChatIds) {
      try {
        await ctx.api.sendMessage(chatId, `📢 **Announcement**\n\n${messageText}`, {
          parse_mode: "Markdown"
        });
        successCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to send message to chat ${chatId}:`, error);
        failCount++;
        failedChats.push(chatId);
      }
    }

    // Send summary report
    let summary = `✅ Broadcast completed!\n\n📊 **Results:**\n✅ Successful: ${successCount}\n❌ Failed: ${failCount}`;
    
    if (failedChats.length > 0) {
      summary += `\n\n🚫 **Failed chat IDs:**\n${failedChats.join(', ')}`;
    }

    await ctx.reply(summary);
  } catch (error) {
    
  }
 
}