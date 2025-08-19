import { ValidatorData } from "../db/validatorDB";

type EpochMetrics = {
  epochNumber: number;
  successCount: number;
  missCount: number;
  totalAttestations: number;
  epochBlockMissedVolume: number;
  epochBlockProducedVolume: number;
  attestationRate: number;
  blockProductionRate: number;
  validatorCommitteeSize: number;
};

export type ValidatorStats = {
  totalActiveValidators: number;
  totalExitingValidators: number;
  currentEpochMetrics: EpochMetrics;
};

export async function fetchEpoch(): Promise<ValidatorStats | null> {
  try {
    const response = await fetch(`https://dashtec.xyz/api/dashboard/current-epoch-stats`);
    
    if (!response.ok) {
      return null;
    }

    const data: ValidatorStats = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}