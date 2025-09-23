import { Context } from "grammy";
import { showValidator } from "../services/showValidator";
import { deleteValidator } from "../services/deleteValidator";
import { deleteMessage } from "../services/deleteMessage";

export default async function callbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;

  if(data?.includes("show")){
    showValidator(ctx);
  }else if(data?.includes("del")){
    deleteValidator(ctx);
  }else {
    deleteMessage(ctx)
  }

}
