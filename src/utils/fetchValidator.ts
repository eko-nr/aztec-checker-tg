import { ValidatorData } from "../db/validatorDB";

export async function fetchValidatorData(address: string): Promise<ValidatorData | null> {
  try {
    const response = await fetch(`${process.env.API_ENDPOINT_CHECKER}/${address}`);
    
    if (!response.ok) {
      console.error(`Fetch validator request failed with status: ${response.status} for address: ${address}`);
      return null;
    }

    const data: ValidatorData = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching validator data for ${address}:`, error);
    return null;
  }
}