import axios from 'axios';
import { ValidatorData } from "../db/validatorDB";

export async function fetchValidatorData(address: string): Promise<ValidatorData | null> {
  try {
    const response = await axios.get<ValidatorData>(
      `${process.env.API_ENDPOINT_CHECKER}/${address}`
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching validator data for ${address}:`, error);
    return null;
  }
}