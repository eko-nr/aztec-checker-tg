import { ValidatorsResponse } from "./fetchQueue";
import moment from 'moment';
import momentTZ from 'moment-timezone'

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

const zone = "Asia/Bangkok"

export function formatQueue(data: ValidatorsResponse, index?: number): string {
  const { validatorsInQueue, filteredCount, pagination, benchmark } = data;
  
  let message = `📊 *Validator in Queue Report* ${index !== undefined ? `(${index+1})` : ""} \n\n`;
  const batchSize = 32;
  const epochTimeMinute = 19.2;
  
  validatorsInQueue.forEach((validator, index) => {
    const batchQueue = Math.ceil(validator.position / batchSize);
    const estActivation = moment().add(batchQueue * epochTimeMinute, 'minutes');
    const diffMs = estActivation.diff(moment());
    const duration = moment.duration(diffMs);

    const estActivationGmt7Time = momentTZ(estActivation).tz(zone);

    const queueTimeGmt7Time = momentTZ(validator.queuedAt).tz(zone);

    message += `🏷️ *Index:* \`${validator.index}\`\n`;
    message += `📍 *Position:* \`${validator.position}\`\n`;
    message += `📧 *Address:* \`${validator.address}\`\n`;
    message += `💳 *Withdrawer:* \`${validator.withdrawerAddress}\`\n`;
    message += `⏳ *Estimate Activation Time:* \`${formatDate(estActivationGmt7Time.toISOString())}\`\n`;
    message += `⏱ *Estimate Time Left:* \`${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s\`\n`;
    message += `🔗 *TX Hash:* \`${validator.transactionHash}\`\n\n`;
    
    message += `⏰ *Queued At:* ${formatDate(queueTimeGmt7Time.toISOString())}\n`;
    message += `────────────────────`;
  });

  return message;
}
