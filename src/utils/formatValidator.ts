import { ValidatorData } from "../db/validatorDB";
import moment from 'moment-timezone'

const zone = "Asia/Bangkok"

type DataValidator = {
  currentData: ValidatorData;
  previousData: ValidatorData | null;
}

export function formatValidatorMessage(data: DataValidator, timestamp: string, index: number): string {
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
    totalParticipatingEpochs = `From ${Number(totalParticipatingEpochs) - 1} => ${totalParticipatingEpochs} (+1)`
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

  return `🔍 **Validator ${data.previousData ? "Status Update" : "Status Data"}** ${data.previousData? "" : `(${index+1})`}
  
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

⏰ Last checked: ${gmt7Time.toLocaleString()}`;
}