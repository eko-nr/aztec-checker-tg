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
  const statusDisplay = data.currentData.status === "Validating" ? "Validator Active" : data.currentData.status;
  const statusEmoji = data.currentData.status === "Validating" ? "🟢" : "⚠️";

  const currentBlockProposalSuccess = data.currentData.totalBlocksMined + data.currentData.totalBlocksProposed;
  const currentBlockProposalFailed = data.currentData.totalBlocksMissed;
  const currentTotalBlock = currentBlockProposalSuccess + currentBlockProposalFailed;
  const currentBlockProsalRate = (currentBlockProposalSuccess/currentTotalBlock*100).toFixed(2)

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
    const prevBlockProsalRate = (prevBlockProposalSuccess/prevTotalBlock*100).toFixed(2)

    rankValidatorMsg = `${data.previousData.rank} => ${data.currentData.rank} (${symbolDirection(data.currentData.rank - data.previousData.rank)})`
    balanceStkMsg = `${prevBalanceInStk} => ${currentBalanceInSTK} (${symbolDirection(Number(currentBalanceInSTK) - Number(prevBalanceInStk))})`;
    attestionRateMsg = `${data.previousData.attestationSuccess} => ${data.currentData.attestationSuccess}`;
    blockProposalORateMsg = `${currentTotalBlock === 0 ? "0" : prevBlockProsalRate} => ${currentTotalBlock === 0 ? "0" : currentBlockProsalRate}`;
    unclaimedRewardMsg = `${prevUnclaimedRewardsInSTK} => ${currentUnclaimedRewardsInSTK} (${symbolDirection(Number(currentUnclaimedRewardsInSTK) - Number(prevUnclaimedRewardsInSTK))})`;
    totalAttestationMsg = {
      success: `${data.previousData.totalAttestationsSucceeded} => ${data.currentData.totalAttestationsSucceeded}`,
      missed: `${data.previousData.totalAttestationsMissed} => ${data.currentData.totalAttestationsMissed}`
    }
    totalBlockProposalMsg = {
      success: `${prevBlockProposalSuccess} => ${currentBlockProposalSuccess}`,
      failed: `${prevBlockProposalFailed} => ${currentBlockProposalFailed}`
    }
  }else{
    rankValidatorMsg = data.currentData.rank.toString();
    balanceStkMsg = currentBalanceInSTK;
    attestionRateMsg = data.currentData.attestationSuccess;
    blockProposalORateMsg = currentTotalBlock === 0 ? "0" : currentBlockProsalRate;
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

  return `🔍 **Validator Status Update** ${data.previousData? "" : `(${index+1})`}
  
📍 **Index:** ${data.currentData.index}
🏆 **Rank:** \`${rankValidatorMsg}\`
📝 **Address:** \`${data.currentData.address}\`
${statusEmoji} **Status:** ${statusDisplay}
💰 **Balance:** ${balanceStkMsg} STK
📊 **Attestation Rate:** ${attestionRateMsg}
🧊 **Block Proposal Rate:** ${blockProposalORateMsg}%
🎁 **Unclaimed Rewards:** ${unclaimedRewardMsg} STK
🕓 **Activation Date:** ${moment(data.currentData.activationDate).toLocaleString()}

📈 **Performance:**
• Total Attestations: ${totalAttestationMsg.success} ✅ / ${totalAttestationMsg.missed} ❌
• Blocks Prosal or Mined: ${totalBlockProposalMsg.success} ✅ / ${totalBlockProposalMsg.failed} ❌
• Participating Epochs: ${data.currentData.totalParticipatingEpochs}

🕒 **Recent Attestations:**
${recentAttestationStatus}

⏰ Last checked: ${gmt7Time.toLocaleString()}`;
}