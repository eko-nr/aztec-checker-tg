import { Context } from "grammy";
import { showValidator } from "../services/showValidator";
import { deleteValidator } from "../services/deleteValidator";
import { deleteMessage } from "../services/deleteMessage";
import listValidators from "../commands/listValidators";

export default async function callbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;

  if(data?.includes("show")){
    showValidator(ctx);
  }else if(data?.includes("del")){
    deleteValidator(ctx);
  }else if(data?.includes("list_validator")){
    listValidators(ctx, true)
  }else if(data?.includes("close")){
    deleteMessage(ctx)
  }

}
