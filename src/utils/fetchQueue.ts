interface ValidatorInQueue {
  position: number;
  address: string;
  withdrawerAddress: string;
  transactionHash: string;
  queuedAt: string; // or Date if you plan to convert to Date objects
  index: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidatorsResponse {
  validatorsInQueue: ValidatorInQueue[];
  filteredCount: number;
  pagination: Pagination;
  benchmark: string;
}

export async function fetchQueue(address: string): Promise<ValidatorsResponse | null> {
  try {
    const response = await fetch(`https://dashtec.xyz/api/validators/queue?page=1&limit=10&search=${address}`);
    
    if (!response.ok) {
      console.error(`Fetch queue request failed with status: ${response.status} for address: ${address}`);
      return null;
    }

    const data: ValidatorsResponse = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}