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

// interface AccountDetails {
//   sourceAccount: string;
//   destinationAccount: string;
//   amount: number;
//   narration: string;
//   reference: string;
// }


export async function splitFunds(context: InvocationContext, input: SplitFundsShare): Promise<{nicLegResult: LegResult, brownCardLegResult: LegResult, partialSplit: boolean}> {

    const sourceAccount = input.sourceAccount;


  // nic share
    let nicLegResult: LegResult 
    try {
        const response = await creditAccount({
            sourceAccount: sourceAccount,
            destinationAccount: process.env.NIC_ACCOUNT_NUMBER || "",
            amount: input.nicShare,
            narration: `NIC share for transaction ${input.transactionReference}`,
            reference: input.transactionReference,
        })

        nicLegResult = {
            leg: "nic",
            success: true,
            reference: response.reference,
            ftNumber: response.data?.ftNumber,
        }
    } catch (error: any) {
        context.error("NOthing moved for nic leg", error)
        return {
            nicLegResult: {
                leg: "nic",
                success: false,
                error: error.response?.data ?? error.message,
            },
            brownCardLegResult: {
                leg: "brownCard",
                success: false,
                error: error.response?.data ?? error.message,
            },
            partialSplit: false
        }
    }

    // Brown card share
    let brownCardLegResult: LegResult

    try {
        const response = await creditAccount({
            sourceAccount: sourceAccount,
            destinationAccount: process.env.BROWN_CARD_ACCOUNT_NUMBER || "",
            amount: input.brownCardShare,
            narration: `Brown card share for transaction ${input.transactionReference}`,
            reference: input.transactionReference,
        })

        return {
            nicLegResult,
            brownCardLegResult: {
                leg: "brownCard",
                success: true,
                reference: response.reference,
                ftNumber: response.data?.ftNumber,
            },
            partialSplit: false

        }
    }
            

    

    catch(error: any){
        context.error("BrownCard Account coyld not be credited", error)
        return {
            nicLegResult,
            brownCardLegResult: {
                leg: "brownCard",
                success: false,
                error: error.response?.data ?? error.message,
            },
            partialSplit: true   
        }

    }

        
    
}