import { ValidatorsResponse } from "./fetchQueue";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function formatQueue(data: ValidatorsResponse, index: number): string {
  const { validatorsInQueue, filteredCount, pagination, benchmark } = data;
  
  let message = `📊 *Validators in Queue Report* (${index+1}) \n\n`;

  message += `🔍 *Validators in Queue:*\n`;

  validatorsInQueue.forEach((validator, index) => {
    message += `\n*${index + 1}. Validator #${validator.position}*\n`;
    message += `📍 *Position:* ${validator.position}\n`;
    message += `🏷️ *Index:* ${validator.index}\n`;
    message += `📧 *Address:* \`${validator.address}\`\n`;
    message += `💳 *Withdrawer:* \`${validator.withdrawerAddress}\`\n`;
    message += `🔗 *TX Hash:* \`${validator.transactionHash}\`\n`;
    message += `⏰ *Queued At:* ${formatDate(validator.queuedAt)}\n`;
    message += `────────────────────`;
  });

  return message;
}
