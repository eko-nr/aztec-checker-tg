import { ValidatorData } from "../db/validatorDB";
import moment from 'moment-timezone'

const zone = "Asia/Bangkok"

export function formatValidatorMessage(data: ValidatorData, timestamp: string, index: number): string {
  const balanceInSTK = (parseFloat(data.balance) / 1e18).toFixed(4);
  const unclaimedRewardsInSTK = (parseFloat(data.unclaimedRewards) / 1e18).toFixed(6);
  const gmt7Time = moment(timestamp).tz(zone);

  // Determine status display
  const statusDisplay = data.status === "Validating" ? "Validator Active" : data.status;
  const statusEmoji = data.status === "Validating" ? "🟢" : "⚠️";
  
  const recentAttestationStatus = data.recentAttestations
    .slice(0, 3)
    .map(att => `Slot ${att.slot}: ${att.status === "Success" ? "✅" : "❌"}`)
    .join("\n");

  return `🔍 **Validator Status Update** (${index+1})}

📍 **Index:** ${data.index}
📝 **Address:** \`${data.address}\`
${statusEmoji} **Status:** ${statusDisplay}
💰 **Balance:** ${balanceInSTK} STK
📊 **Attestation Success:** ${data.attestationSuccess}
🎁 **Unclaimed Rewards:** ${unclaimedRewardsInSTK} STK
🕓 **Activation Date:** ${moment(data.activationDate).toLocaleString()}

📈 **Performance:**
• Total Attestations: ${data.totalAttestationsSucceeded} ✅ / ${data.totalAttestationsMissed} ❌
• Blocks Mined: ${data.totalBlocksMined}
• Participating Epochs: ${data.totalParticipatingEpochs}

🕒 **Recent Attestations:**
${recentAttestationStatus}

⏰ Last checked: ${gmt7Time.toLocaleString()}`;
}