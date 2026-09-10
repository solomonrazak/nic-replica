import { InvocationContext } from "@azure/functions";
import { apiClient } from "../utils/apiClient";
import { creditAccount } from "../utils/fund-transfer";


interface SplitFundsShare {
    transactionReference: string;
    nicShare: number;
    brownCardShare: number;
    sourceAccount: string;
}

interface LegResult {
    leg: "nic" | "brownCard";
    success: boolean;
    error?: string;
    reference?: string;
    ftNumber?: string;
}


export async function splitFunds(context: InvocationContext, input: SplitFundsShare): Promise<LegResult[]> {
    try {
        // Call the NIC API to split funds
        
    } catch (error: any) {
        context.log("Error splitting funds:", error.response?.data ?? error.message);
        throw new Error("Failed to split funds");
    }
}