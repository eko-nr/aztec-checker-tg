import { ValidatorData } from "../db/validatorDB";

interface Slot {
  slotNumber: number;
  status: 'no_data' | 'attestation-sent' | 'attestation-missed' | 'block-proposed' | 'other-status';
  tooltip: string;
}

interface ValidatorActivity {
  validatorIndex: string;
  validatorAddress: `0x${string}`;
  displayName: string;
  x_handle: string | null;
  name: string | null;
  slots: Slot[];
}

export interface EpochValidator {
  activities: ValidatorActivity[];
}

export async function fethEpochValidator(epoch: number): Promise<EpochValidator | null> {
  try {
    const response = await fetch(`https://dev.dashtec.xyz/api/epochs/${epoch}/live-slot-activity`);
    
    if (!response.ok) {
      console.error(`Fetch epoch validator failed with status: ${response.status} for epoch: ${epoch}`);
      return null;
    }

    const data: EpochValidator = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching epoch validator data for epoch ${epoch}:`, error);
    return null;
  }
}