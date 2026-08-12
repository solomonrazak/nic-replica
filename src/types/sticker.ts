export interface NicResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}


export interface StickerRequest {
  transactionReference: string;
  companyName: string;
  amountPaid: number | string |null;  
  quantity: number;
  paymentMode: string;
  requestStatus: string;       
  cost: number;                
  NIC: number;                 
  BROWNCARD: number;           
}


export interface ApproveStickerInput {
  amountPaid: number;
  transactionReference: string;
  bankReference: string;
}

export interface WalletToBankResponseData {
  responseCode: string;
  message: string;
  data: {
    transactionId: string;
  };
}

export interface WalletToBankData {
  customerPhoneNumber: string;
  amount: number;
  channel: string;
  description?: string;
  transactionFee: number;
  elevyFee: number;
  callBackUrl: string;
}

export interface WalletToBankResponseData {
  responseCode: string;
  message: string;
  data: {
    transactionId: string;
  };
}

export interface ComputeResponseData {
  responseCode: string;
  message: string;
  data: {
    recipientNumber: string;
    amount: number;
    clientReference: string;
    elevy: number;
  };
}

export interface Data {
  ftNumber: string;
}