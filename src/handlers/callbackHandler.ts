import { Context } from "grammy";
import { showValidator } from "../services/showValidatorService";
import { deleteValidator } from "../services/deleteValidatorService";
import { deleteMessage } from "../services/deleteMessageService";
import listValidatorsService from "../services/listValidatorsService";
import listQueueValidatorsService from "../services/listQueueValidatorsService";

export default async function callbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;

  if(data?.includes("show")){
    showValidator(ctx);
  }else if(data?.includes("del")){
    deleteValidator(ctx);
  }else if(data?.includes("list_validator")){
    listValidatorsService(ctx, true)
  }else if(data?.includes("list_queue_validator")){
    listQueueValidatorsService(ctx, true)
  }else if(data?.includes("close")){
    deleteMessage(ctx)
  }

}
