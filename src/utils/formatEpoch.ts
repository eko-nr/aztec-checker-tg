import { ValidatorStats } from "./fetchEpoch";
import { EpochValidator } from "./fetchEpochValidator";
import { getNextEpochDate } from "./getEpochTime";
import moment from 'moment-timezone'

export const formatEpoch = (data: ValidatorStats) => {
  const nextEpoch = getNextEpochDate();
  const now = moment.tz("Asia/Jakarta");

  const diffMs = nextEpoch.diff(now);
  const duration = moment.duration(diffMs);

  return `
🔥 **Validator Network Pulse 🔥**  
*(Epoch ${data.currentEpochMetrics.epochNumber} Update)*  

🔜 **Next Epoch In:** ${duration.minutes()} minutes ${duration.seconds()} seconds

🌐 **Active Validators:** ${data.totalActiveValidators} 🚀  
👋 **Exiting Validators:** ${data.totalExitingValidators} *(Keeping an eye on this!)*  

🛡️ **ATTESTATION REPORT:**  
✅ **Success:** ${data.currentEpochMetrics.successCount} (${((data.currentEpochMetrics.successCount / data.currentEpochMetrics.totalAttestations) * 100).toFixed(2)}%)  
❌ **Missed:** ${data.currentEpochMetrics.missCount} (${((data.currentEpochMetrics.missCount / data.currentEpochMetrics.totalAttestations) * 100).toFixed(2)}%)  
*Attesters, where ya at? 😉*  

⛏️ **BLOCK PRODUCTION:**  
⚡ **Produced:** ${data.currentEpochMetrics.epochBlockProducedVolume} / ${data.currentEpochMetrics.epochBlockProducedVolume + data.currentEpochMetrics.epochBlockMissedVolume} (${data.currentEpochMetrics.blockProductionRate}%)  
💸 **Missed Volume:** ${data.currentEpochMetrics.epochBlockMissedVolume} *(Ouch!)*  
*Block proposers, step it up! 💪*  

🏁 **Committee Size:** ${data.currentEpochMetrics.validatorCommitteeSize}  
  `
}

export const formatEpochValidator = (data: EpochValidator, validatorAddress: string): string | null => {
  
  // Find specific validator by address
  const targetValidator = data.activities.find(validator => 
    validator.validatorAddress.toLowerCase() === validatorAddress.toLowerCase()
  );

  if (!targetValidator) {
    return null;
  }

  // Check if validator has active slots
  const activeSlots = targetValidator.slots.filter(slot => slot.status !== 'no_data');
  
  if (activeSlots.length === 0) {
    return `💤 ${targetValidator.displayName} idle this epoch\n📍 ${targetValidator.validatorAddress}\n⏸️ No active slots assigned`;
  }

  // Calculate performance metrics
  const attestationsSent = targetValidator.slots.filter(slot => slot.status === 'attestation-sent').length;
  const attestationsMissed = targetValidator.slots.filter(slot => slot.status === 'attestation-missed').length;
  const blocksProposed = targetValidator.slots.filter(slot => slot.status === 'block-proposed').length;
  
  const xHandleText = targetValidator.x_handle ? `\n🐦 @${targetValidator.x_handle}` : '';
  const performanceRate = activeSlots.length > 0 ? 
    Math.round((attestationsSent / activeSlots.length) * 100) : 0;

  // Collect all possible messages
  const messages = [];

  // Perfect performance
  if (attestationsMissed === 0 && attestationsSent > 0) {
    if (blocksProposed > 0) {
      messages.push(`🎯 ${targetValidator.displayName} perfect epoch + block proposal\n📍 \`${targetValidator.validatorAddress}\`\n🏗️ ${blocksProposed} blocks, ${attestationsSent} attestations ✅${xHandleText}`);
    }
    messages.push(`✅ ${targetValidator.displayName} perfect epoch\n📍 \`${targetValidator.validatorAddress}\`\n📊 ${attestationsSent}/${activeSlots.length} attestations successful${xHandleText}`);
  }
  
  // Complete failure
  if (attestationsMissed > 0 && attestationsSent === 0) {
    messages.push(`🚨 ${targetValidator.displayName} all attestations missed\n📍 \`${targetValidator.validatorAddress}\`\n❌ ${attestationsMissed} failed attestations - check node${xHandleText}`);
  }
  
  // Mixed performance
  if (attestationsMissed > 0) {
    messages.push(`⚠️ ${targetValidator.displayName} mixed performance\n📍 \`${targetValidator.validatorAddress}\`\n📊 ${attestationsSent} sent, ${attestationsMissed} missed (${performanceRate}%)${xHandleText}`);
  }
  
  // Block proposal only
  if (blocksProposed > 0) {
    messages.push(`🏗️ ${targetValidator.displayName} block proposal\n📍 \`${targetValidator.validatorAddress}\`\n⛏️ ${blocksProposed} blocks proposed${xHandleText}`);
  }
  
  // Default active message
  messages.push(`📈 ${targetValidator.displayName} active this epoch\n📍 \`${targetValidator.validatorAddress}\`\n📋 ${activeSlots.length} slots assigned${xHandleText}`);

  // Return all messages joined with separator
  return messages.join('\n\n---\n\n');
};