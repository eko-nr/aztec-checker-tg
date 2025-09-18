import { ValidatorData } from "../db/validatorDB";

type Validator = {
  index: string;
  address: string;
  status: string;
  balance: string;
  attestationSuccess: string;
  proposalSuccess: string;
  lastProposed: string;
  performanceScore: number;
  totalAttestationsSucceeded: number;
  totalAttestationsMissed: number;
  totalBlocksProposed: number;
  totalBlocksMined: number;
  totalBlocksMissed: number;
  totalParticipatingEpochs: number;
  rank: number;
};

type ValidatorsResponse = {
  validators: Validator[];
};


export async function fetchValidatorData(address: string): Promise<ValidatorData | null> {
  try {
    const responseValidators = await fetch(`https://dev.dashtec.xyz/api/validators?page=1&limit=10&sortBy=rank&sortOrder=asc&search=${address}`);
    const response = await fetch(`https://dev.dashtec.xyz/api/validators/${address}`);
    
    if (!response.ok || !responseValidators.ok) {
      console.error(`Fetch validator request failed with status: ${response.status} for address: ${address}`);
      return null;
    }

    const dataValidators: ValidatorsResponse = await responseValidators.json();
    const validator = dataValidators.validators.find((x) => x.address.toLowerCase() === address.toLowerCase())

    const data: ValidatorData = await response.json();

    return {
      ...data,
      rank: validator?.rank || 0,
    };
  } catch (error) {
    console.error(`Error fetching validator data for ${address}:`, error);
    return null;
  }
}