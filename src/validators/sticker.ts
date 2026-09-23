import { z } from "zod";

export const validateStickerProcess = z.object({
  transactionReference: z.string().min(1, "transactionReference is required"),
  branchFullName: z.string().min(1, "branchFullName is required"),
  tellerPaymentChannel: z.enum(
    ["BANK_TRANSFER", "MOBILE_MONEY"],
    "payment channel or mode is required"
  ),
  customerPhoneNumber: z.string().optional(),
  channel: z.string().optional(),
  payeeName: z.string().optional(),
});

export type StickerProcessPayload =
  z.infer<typeof validateStickerProcess>;