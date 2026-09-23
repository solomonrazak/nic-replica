import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { approveSticker, searchSticker } from "../services/sticker.service";
import { StickerReponse } from "../types/sticker";
import { validateStickerProcess } from "../validators/sticker";
import { prisma } from '../../connection/prisma'
import { tr } from "zod/locales";
import { isSplitRight } from "../utils/helpers";


export async function processStickerHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    // let body: { transactionReference?: string, branchFullName?: string, tellerPaymentChannel?: "BANK_TRANSFER" | "MOBILE_MONEY", customerPhoneNumber?: string, channel?: string, payeeName?: string } | undefined;
    try {
        // body = request.json() as typeof body;

        // // check if body is empty

        // if(!body || typeof body !== "object"){
        //     context.warn("request body cannot be empty");
        //     return { // return or stop executing the function if there is no body.  -- return ends the execution of the program.
        //         status: 400,
        //         jsonBody: {
        //             message: "Invalid or missing request body"
        //         }
        //     }
        // }

        // const transactionReference = body?.transactionReference;
        // const customerPhoneNumber = body?.customerPhoneNumber;
        // const tellerPaymentChannel = body?.tellerPaymentChannel;
        // const payeeName = body?.payeeName;

        // zod validation
        const payload = validateStickerProcess.parse(
            await request.json()
        )

        const transactionReference = payload.branchFullName;
        const customerPhoneNumber = payload.customerPhoneNumber;
        const tellerPaymentChannel = payload.tellerPaymentChannel;
        const payeeName = payload.payeeName;

        const sourceAccount = "1232445573774"

        // idempotency check
        const existing = await prisma.StickerRequest.findUnique({
            where: {transactionReference}
        })

        // first check.

        if(existing?.processingStatus === "PENdDING"){
            context.log("sticker already in processing state", transactionReference)
            return {
                status: 400,
                jsonBody: {
                    code: "PAYMENT_PROCESSING",
                    message: "This sticker payment is already being processed.", transactionReference
                    
                }
            }
        }

        // second check

        if(existing?.processingStatus === "COMPLETED"){
            context.log("Sticker already completely processed", transactionReference)
            return {
                status: 400,
                jsonBody: {
                    status: 400,
                    jsonBody: {
                        code: "COMPLETED",
                        message: "This sticker is already paid", transactionReference
                    }
                }
            }
        }

        // third check
        if(existing?.processStatus === "PARTIAL_PAYOUT"){
            context.log("This sticker is partially paid out", transactionReference);
            return {
                status: 400,
                jsonBody: {
                    message: "sticker is in partially paid out", transactionReference
                }
            }
        }

        // can write other idempotency checks later
        if(existing?.processingStatis === "PAID"){
          context.log("Resuming from PAID — retrying NIC approve only:", transactionReference);

          const approval = await approveSticker({
            transactionReference, 
            amountPaid: existing.cost,
            bankReference: existing.nicRrNumber
          })

          if(!approval.success){
            context.warn("Money moved or NIC account credited but refused to approve");
            return {
                status: 502,
                jsonBody: {message: "NIC approval failed, still needs manual reconciliation"}
            }
          }
         
            const completed = await prisma.StickerRequest.update({
                where: { transactionReference},
                data: {processingStatus: "COMPLETED"}
            })
         return {
            status: 200,
            jsonBody: completed
         }
        }

        const {data: splitResult} = await searchSticker(transactionReference);

        if(!isSplitRight(splitResult)){
            context.warn("Split doesnt reconcile", {cost: splitResult.cost, NIC: splitResult.NIC, BrownCard: splitResult.BROWNCARD});
            return {
            status: 422,
            jsonBody: {message: "Split doesnt reconcile, cannot proceed with payment."}
        }
        }

        

        await prisma.StickerRequest.upsert({
            where: { transactionReference },
            update: {
                requestStatus: splitResult.requestStatus,
                cost: splitResult.cost,
                NIC: splitResult.NIC,
                BrownCard: splitResult.BROWNCARD,
                tellerPaymentChannel: tellerPaymentChannel,
                payeeName: payeeName,

            },
            create: {
                transactionReference,
                companyName: splitResult.companyName,
                amountPaid: splitResult.amountPaid == null ? null : Number(splitResult.amountPaid),
                quantity: splitResult.quantity,
                paymentMode: splitResult.paymentMode,
                requestStatus: splitResult.requestStatus,
                cost: splitResult.cost, NIC: splitResult.NIC, BROWNCARD: splitResult.BROWNCARD,
                sourceAccount: sourceAccount,
                tellerPaymentChannel: tellerPaymentChannel,
                payeeName: payeeName,

            },

        })
            

        if(tellerPaymentChannel === "MOBILE_MONEY"){
            
        }



        

    }
    catch(){


    }
};

app.http('process-sticker', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: processStickerHandler
});
