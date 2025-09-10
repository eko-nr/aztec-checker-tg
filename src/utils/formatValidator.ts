import { ValidatorData, ValidatorDatabase } from "../db/validatorDB";
import moment from 'moment-timezone'

const zone = "Asia/Bangkok"

const database = new ValidatorDatabase()

export async function formatValidatorMessage(data: ValidatorData, timestamp: string, index: number, isCompareChanges = false): Promise<string> {
  const compareData = await database.getValidatorDataComparison(data.address);
  const balanceInSTK = (parseFloat(data.balance) / 1e18).toFixed(4);

  const prevUnclaimedRewardsInSTK = (parseFloat(compareData.previous?.unclaimedRewards || "0") / 1e18).toFixed(6);
  const currentUnclaimedRewardsInSTK = (parseFloat(data.unclaimedRewards) / 1e18).toFixed(6);
  const gmt7Time = moment(timestamp).tz(zone);

  // Determine status display
  const statusDisplay = data.status === "Validating" ? "Validator Active" : data.status;
  const statusEmoji = data.status === "Validating" ? "🟢" : "⚠️";

  const blockProposalSuccess = data.totalBlocksMined + data.totalBlocksProposed;
  const blockProposalFailed = data.totalBlocksMissed;
  const totalBlock = blockProposalSuccess + blockProposalFailed;

  const prevBlockPropsalSuccess = compareData.previous?.totalBlocksMined! || 0 + compareData.previous?.totalBlocksProposed! || 0
  const prevBlockProposalFailed = compareData.previous?.totalBlocksMissed || 0;
  const prevTotalBlock = prevBlockPropsalSuccess + prevBlockProposalFailed;

  const prevBlockProposalRate = totalBlock > 0 ? (prevBlockPropsalSuccess/prevTotalBlock*100).toFixed(1) : 0;
  const currentBlockProposalRate = totalBlock > 0 ? (blockProposalSuccess/totalBlock*100).toFixed(1) : 0;

  const recentAttestationStatus = data.recentAttestations
    .slice(0, 5)
    .map(att => `Slot ${att.slot}: ${att.status === "Success" ? "✅" : "❌"}`)
    .join("\n");

  const directionSymbol = (direction: "up" | "down" | "same" | undefined) => {
    if(!direction || direction === "same"){
      return "no changes"
    }
    
    return direction === "up" ? "+" : "-"
  }

  return `🔍 **Validator Status Update** (${index+1})
  
📍 **Index:** ${data.index} 
🏆 **Rank:** \`${isCompareChanges ? `${compareData.previous?.rank} => ${compareData.current.rank} (${directionSymbol(compareData.changes.rank?.direction)})` : data.rank}\
📝 **Address:** \`${data.address}\`
${statusEmoji} **Status:** ${statusDisplay}
💰 **Balance:** ${isCompareChanges ? `${compareData.previous?.balance} => ${compareData.current.balance} (${directionSymbol(compareData.changes.balance?.direction)})` : balanceInSTK} STK
📊 **Attestation Rate:** ${isCompareChanges ? `${compareData.previous?.attestationSuccess} => ${compareData.current.attestationSuccess} (${directionSymbol(compareData.changes.attestationSuccess?.direction)})` : data.attestationSuccess}
🧊 **Block Proposal Rate:** ${isCompareChanges ? `${prevBlockProposalRate} => ${currentBlockProposalRate}` : currentBlockProposalRate}%
🎁 **Unclaimed Rewards:** ${isCompareChanges ? `${prevUnclaimedRewardsInSTK} => ${currentUnclaimedRewardsInSTK}` : currentUnclaimedRewardsInSTK} STK
🕓 **Activation Date:** ${moment(data.activationDate).toLocaleString()}

📈 **Performance:**
• Total Attestations: ${isCompareChanges ? `${compareData.previous?.totalAttestationsSucceeded} => ${compareData.current.totalAttestationsSucceeded} (${directionSymbol(compareData.changes.totalAttestationsSucceeded?.direction)}` : data.totalAttestationsSucceeded} ✅ / ${isCompareChanges ? `${compareData.previous?.totalAttestationsMissed} => ${compareData.current.totalAttestationsMissed} (${directionSymbol(compareData.changes.totalAttestationsMissed?.direction)}` : data.totalAttestationsMissed} ❌
• Blocks Prosal or Mined: ${isCompareChanges ? `${prevBlockPropsalSuccess} => ${blockProposalSuccess} (+${blockProposalSuccess - prevBlockPropsalSuccess})` : blockProposalSuccess} ✅ / ${isCompareChanges ? `${prevBlockProposalFailed} => ${blockProposalFailed} (+${blockProposalFailed - prevBlockProposalFailed})` : blockProposalFailed} ❌
• Participating Epochs: ${isCompareChanges ? `${compareData.previous?.totalParticipatingEpochs} => ${data.totalParticipatingEpochs} (${directionSymbol(compareData.changes.totalParticipatingEpochs?.direction)})` : data.totalParticipatingEpochs}

🕒 **Recent Attestations:**
${recentAttestationStatus}

⏰ Last checked: ${gmt7Time.toLocaleString()}`;
}