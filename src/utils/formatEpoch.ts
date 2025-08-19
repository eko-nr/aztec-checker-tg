import { ValidatorStats } from "./fetchEpoch";

export const formatEpoch = (data: ValidatorStats) => {
  return `
🔥 **Validator Network Pulse 🔥**  
*(Epoch ${data.currentEpochMetrics.epochNumber} Update)*  

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