import axios from 'axios';

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
    const response = await axios.get<ValidatorStats>(
      'https://dashtec.xyz/api/dashboard/current-epoch-stats'
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching epoch data:', error);
    return null;
  }
}