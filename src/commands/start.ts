import { Context } from "grammy";

export default function startCommand(ctx: Context) {
  ctx.reply(`👋 Hello! I'm your Aztec validator assistant!

I'll quietly watch your validators in the background and only pop up if something needs your attention.

**Here’s how to use me:**
✨ Use /add_validator <your_address> to add a validator to your watchlist.
📋 Use /show_validators to see your list.
📈 Use /get_epoch_validators to get all validators stats for the current epoch.
📊 Use /epoch to check the current epoch's stats.

My data is refreshed every 10 minutes. Ready to start? Use /add_validator to add your first validator!
`);
  setTimeout(() => {
    ctx.api.deleteMessage(ctx.chat?.id!, ctx.message?.message_id!);
  }, 5000);
}
