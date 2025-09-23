import { ValidatorData } from "../db/validatorDB";
import moment from 'moment-timezone'

const zone = "Asia/Bangkok"
const EPOCH_DURATION_MINUTES = 20; // 20 minutes per epoch

type DataValidator = {
  currentData: ValidatorData;
  previousData: ValidatorData | null;
}

interface CleanValidatorActivity {
  validatorIndex: string;
  validatorAddress: string;
  displayName: string;
  x_handle: string | null;
  name: string | null;
  slotsCount: number;
}

type Epoch = {
  currentEpoch: number;
  epochs: Array<{
    epoch: number;
    validator: CleanValidatorActivity;
    timestamp: string;
  }>
}

// Function to calculate next epoch time
function calculateNextEpochTime(currentEpoch: number, targetEpoch: number): string {
  const epochsToWait = targetEpoch - currentEpoch;
  const minutesToWait = epochsToWait * EPOCH_DURATION_MINUTES;
  
  const nextEpochTime = moment().tz(zone).add(minutesToWait, 'minutes');
  const now = moment().tz(zone);
  
  // Calculate time remaining
  const duration = moment.duration(nextEpochTime.diff(now));
  
  let timeRemaining = "";
  if (duration.asHours() >= 1) {
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    timeRemaining = `${hours}h ${minutes}m`;
  } else {
    const minutes = Math.floor(duration.asMinutes());
    const seconds = duration.seconds();
    timeRemaining = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }
  
  return `Epoch ${targetEpoch} in ${timeRemaining} (${nextEpochTime.format('MMM DD, HH:mm')} ${zone})`;
}

// Function to find next upcoming epoch for this validator
function findNextValidatorEpoch(currentEpoch: number, epochs: Epoch['epochs']): number | null {
  const futureEpochs = epochs
    .filter(e => e.epoch > currentEpoch)
    .sort((a, b) => a.epoch - b.epoch);
  
  return futureEpochs.length > 0 ? futureEpochs[0].epoch : null;
}

export function formatValidatorMessage(data: DataValidator, timestamp: string, epoch: Epoch, index?: number): string {
  const gmt7Time = moment(timestamp).tz(zone);

  // Determine status display
  const statusDisplay = data.currentData.status === "Validating" ? "Active" : data.currentData.status;
  const statusEmoji = data.currentData.status === "Validating" ? "🟢" : "⚠️";

  const currentBlockProposalSuccess = data.currentData.totalBlocksMined + data.currentData.totalBlocksProposed;
  const currentBlockProposalFailed = data.currentData.totalBlocksMissed;
  const currentTotalBlock = currentBlockProposalSuccess + currentBlockProposalFailed;
  const currentBlockProsalPercent = (currentBlockProposalSuccess/currentTotalBlock*100).toFixed(2)

  const currentUnclaimedRewardsInSTK = (parseFloat(data.currentData.unclaimedRewards) / 1e18).toFixed(6);
  const currentBalanceInSTK = (parseFloat(data.currentData.balance) / 1e18).toFixed(4);

  let rankValidatorMsg = ""
  let balanceStkMsg = ""
  let attestionRateMsg = ""
  let blockProposalORateMsg = ""
  let unclaimedRewardMsg = ""
  let totalAttestationMsg = {
    success: "",
    missed: ""
  }
  let totalBlockProposalMsg = {
    success: "",
    failed: ""
  }
  let totalParticipatingEpochs = data.currentData.totalParticipatingEpochs.toString();

  const symbolDirection = (change: number) => {
    if(change === 0){
      return "no changes";
    }

    return change > 0 ? `+${change}` : `${change}`
  }

  if(data.previousData){
    const prevBalanceInStk = (parseFloat(data.previousData.balance) / 1e18).toFixed(4);
    const prevUnclaimedRewardsInSTK = (parseFloat(data.previousData.unclaimedRewards) / 1e18).toFixed(6);

    const prevBlockProposalSuccess = data.previousData.totalBlocksMined + data.previousData.totalBlocksProposed;
    const prevBlockProposalFailed = data.previousData.totalBlocksMissed;
    const prevTotalBlock = prevBlockProposalSuccess + prevBlockProposalFailed;
    const prevBlockProsalPercent = (prevBlockProposalSuccess/prevTotalBlock*100).toFixed(2)

    rankValidatorMsg = `From ${data.previousData.rank} => ${data.currentData.rank} (${symbolDirection(data.currentData.rank - data.previousData.rank)})`
    balanceStkMsg = `From ${prevBalanceInStk} => ${currentBalanceInSTK} (${symbolDirection(Number(currentBalanceInSTK) - Number(prevBalanceInStk))})`;
    attestionRateMsg = `From ${data.previousData.attestationSuccess} => ${data.currentData.attestationSuccess}`;
    blockProposalORateMsg = `From ${prevBlockProsalPercent || "0"}% => ${currentBlockProsalPercent || "0"}%`;
    unclaimedRewardMsg = `From ${prevUnclaimedRewardsInSTK} => ${currentUnclaimedRewardsInSTK} (${symbolDirection(Number(currentUnclaimedRewardsInSTK) - Number(prevUnclaimedRewardsInSTK))})`;
    totalAttestationMsg = {
      success: `${data.previousData.totalAttestationsSucceeded} => ${data.currentData.totalAttestationsSucceeded} (${symbolDirection(data.currentData.totalAttestationsSucceeded - data.previousData.totalAttestationsSucceeded)})`,
      missed: `${data.previousData.totalAttestationsMissed} => ${data.currentData.totalAttestationsMissed} (${symbolDirection(data.currentData.totalAttestationsMissed - data.previousData.totalAttestationsMissed)})`
    }
    totalBlockProposalMsg = {
      success: `${prevBlockProposalSuccess} => ${currentBlockProposalSuccess} (${symbolDirection(currentBlockProposalSuccess-prevBlockProposalSuccess)})`,
      failed: `${prevBlockProposalFailed} => ${currentBlockProposalFailed} (${symbolDirection(currentBlockProposalFailed - prevBlockProposalFailed)})`
    }
    totalParticipatingEpochs = `From ${data.previousData.totalParticipatingEpochs} => ${data.currentData.totalParticipatingEpochs} (${symbolDirection(data.currentData.totalParticipatingEpochs - data.previousData.totalParticipatingEpochs)})`
  }else{
    rankValidatorMsg = data.currentData.rank.toString();
    balanceStkMsg = currentBalanceInSTK;
    attestionRateMsg = data.currentData.attestationSuccess;
    blockProposalORateMsg = currentTotalBlock === 0 ? "0" : currentBlockProsalPercent;
    unclaimedRewardMsg = currentUnclaimedRewardsInSTK;
    totalAttestationMsg = {
      success: data.currentData.totalAttestationsSucceeded.toString(),
      missed: data.currentData.totalAttestationsMissed.toString()
    }
    totalBlockProposalMsg = {
      success: currentBlockProposalSuccess.toString(),
      failed: currentBlockProposalFailed.toString()
    }
  }

  const recentAttestationStatus = data.currentData.recentAttestations
    .slice(0, 5)
    .map(att => `Slot ${att.slot}: ${att.status === "Success" ? "✅" : "❌"}`)
    .join("\n");

  // Find upcoming epochs (up to 5)
  const upcomingEpochs = epoch.epochs
    .filter(e => e.epoch > epoch.currentEpoch)
    .sort((a, b) => a.epoch - b.epoch)
    .slice(0, 5)
    .map(e => {
      const epochTime = moment().tz(zone).add((e.epoch - epoch.currentEpoch) * EPOCH_DURATION_MINUTES, 'minutes');
      const timeLeft = moment.duration(epochTime.diff(moment().tz(zone)));
      
      // Format time left
      let timeLeftStr = "";
      if (timeLeft.asDays() >= 1) {
        const days = Math.floor(timeLeft.asDays());
        const hours = timeLeft.hours();
        const minutes = timeLeft.minutes();
        timeLeftStr = `${days}d ${hours}h ${minutes}m`;
      } else if (timeLeft.asHours() >= 1) {
        const hours = Math.floor(timeLeft.asHours());
        const minutes = timeLeft.minutes();
        timeLeftStr = `${hours}h ${minutes}m`;
      } else {
        const minutes = Math.floor(timeLeft.asMinutes());
        const seconds = timeLeft.seconds();
        timeLeftStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      }
      
      return `\`Epoch ${e.epoch} - ${epochTime.format('YYYY MMM DD, HH:mm')} - in (${timeLeftStr})\``;
    });
  
  const upcomingEpochsInfo = upcomingEpochs.length > 0 
    ? upcomingEpochs.join('\n')
    : "No upcoming epochs scheduled";

  return `🔍 **Validator ${data.previousData ? "Status Update" : "Status Data"}** ${index !== undefined ? `(${index+1})` : ""}
  
📍 **Index:** \`${data.currentData.index}\`
🏆 **Rank:** \`${rankValidatorMsg}\`
📝 **Address:** \`${data.currentData.address}\`
${statusEmoji} **Status:** \`${statusDisplay}\`
💰 **Balance:** \`${balanceStkMsg} STK\`
📊 **Attestation Rate:** \`${attestionRateMsg}\`
🧊 **Block Proposal Rate:** \`${blockProposalORateMsg}%\`
🎁 **Unclaimed Rewards:** \`${unclaimedRewardMsg} STK\`
🕓 **Activation Date:** \`${moment(data.currentData.activationDate).toLocaleString()}\`

📈 **Performance:**
• Total Attestations: \`${totalAttestationMsg.success} ✅ / ${totalAttestationMsg.missed} ❌\`
• Blocks Prosal or Mined: \`${totalBlockProposalMsg.success} ✅ / ${totalBlockProposalMsg.failed} ❌\`
• Participating Epochs: \`${totalParticipatingEpochs}\`

🕒 **Recent Attestations:**
${recentAttestationStatus}

📅 **Upcoming Epochs:**
${upcomingEpochsInfo}
`;
}

// Export utility functions
export { calculateNextEpochTime, findNextValidatorEpoch };