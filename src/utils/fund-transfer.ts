import axios from "axios";
import { InvocationContext } from "@azure/functions";
import { stringify } from "flatted";                    
import { PaymentDetails } from "./helpers";                  
import { withTelemetrySpan } from "./telemetry";
import { WalletToBankData, WalletToBankResponseData } from "../types/sticker";

async function GetAuthorizationString(sourceAccount: string) {
  const { data: response } = await withTelemetrySpan(   
    "corebanking.create_authorization",
    { "http.method": "post", "service.name": "corebanking" },
    () =>
      axios({
        url: "https://api.myumbbank.com/corebanking/v1/createauthorization",
        method: "post",
        data: { accountNumber: sourceAccount },
        headers: {
          "Ocp-Apim-Subscription-Key": String(process.env.COREBANKING_SUBSCRIPTION),
        },
      })
  );

  return response?.data?.authorizationString;
}

// ─────────────────────────────────────────────────────────────
// core banking: credit ONE destination account (used twice for the NIC split)
// NOTE: this THROWS on failure — payNicSplit catches per-leg to detect partial payouts.
// ─────────────────────────────────────────────────────────────
interface AccountDetails {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  narration: string;
  reference: string;
}

export async function creditAccount(input: AccountDetails) {

  
  //////
  const authorizationString = await GetAuthorizationString(input.sourceAccount);

  const { data: response } = await withTelemetrySpan(     // FIX 2: fund transfers now traced
    "corebanking.fund_transfer",
    {
      "http.method": "post",
      "service.name": "corebanking",
      "payment.amount": Number(input.amount),
      "payment.reference": input.reference,
    },
    () =>
      axios({
        url: "https://api.myumbbank.com/corebanking/v1/fundtransfer",
        method: "post",
        headers: { "Ocp-Apim-Subscription-Key": process.env.COREBANKING_SUBSCRIPTION },
        data: {
          creditAccount: input.destinationAccount,
          RrNumber: input.reference,
          paymentDetails: "eb.bill.payments",
          paymentDetailsNew: PaymentDetails(input.narration).slice(0, 2),
          amount: Number(input.amount),
          serviceType: "FundsTransfer",
          authorizationString,
          isImmediate: true,
          ftType: "NORMAL",
        },
      })
  );

  return response;
}

// ─────────────────────────────────────────────────────────────
// wallet-to-bank: COLLECT momo from the customer into a UMB account.
// NOTE: this only STARTS the collection — the real result arrives later at callbackUrl.
// NOTE: this THROWS on failure (see FIX 3) so callers handle it like creditAccount.
// ─────────────────────────────────────────────────────────────
export async function WalletToBank(
  context: InvocationContext,
  data: WalletToBankData,
  destinationAccount: string,
  reference: string
): Promise<WalletToBankResponseData> {
  const { data: response } = await withTelemetrySpan(
    "wallettobank.collect",
    {
      "http.method": "post",
      "service.name": "wallettobank",
      "payment.amount": data.amount,
      "payment.channel": data.channel,
      "payment.reference": reference,
    },
    () =>
      axios({
        method: "post",
        url: "https://api.myumbbank.com/wallettobank-internal/v1/collect",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": process.env.SUBKEY_WALLETTOBANK,
        },
        data: {
          destinationAccount: destinationAccount,
          customerNumber: data.customerPhoneNumber,
          channel: data.channel,
          amount: data.amount,
          transactionFee: data.transactionFee,
          elevy: data.elevyFee,
          callbackUrl: data.callBackUrl,
          description: data.description,
          clientReference: reference,
        },
      })
  );

  return response;
}