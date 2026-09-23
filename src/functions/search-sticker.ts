import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { searchSticker } from "../services/sticker.service";
import { isSplitRight, mapError } from "../utils/helpers";
import { prisma } from '../../connection/prisma'


export async function searchStickerHandler(
    request: HttpRequest,
    context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // first we need to get transaction from the query string;
        const transactionReference = request.query.get("transactionReference");

        if (!transactionReference) {
            return {
                status: 400,
                jsonBody: { message: "transactionReference query parameter is required" }
                ,
            }
        }

        // call the service that looks up the sticker from the NIC API

        const { data } = await searchSticker(transactionReference);

        //    const {data: splitResult} = await searchSticker(transactionReference)

        // check if the split between NIC and BROWNCARD matches the total cost
        if (!isSplitRight(data)) {
            context.warn("The split between NIC and BROWNCARD does not match the total cost", { transactionReference, ...data })

        }

        //      if(!isSplitRight(splitResult)){
        //     context.warn("The split between NIC and BROWNCARD does not match the total cost", {transactionReference, ...splitResult})

        //    }

        // check if record exists and is completed or awaiting payment

        const existing = await prisma.StickerRequest.FindUnique({
            where: { transactionReference },
            select: { processingStatus: true, createdAt: true }
        })

        const alreadyProcessed = existing?.processingStatus === "COMPLETED";
        const inProgress = existing?.processingStatus === "AWAITING_PAYMENT" || existing?.processingStatus === "PAID";

        context.log("breakdown of sticker payments", {
            "TotalCost": data.cost,
            "NIC": data.NIC,
            "BrownCard": data.BROWNCARD,
            "Sticker Number": transactionReference

        })

        return {
            status: 200,
            jsonBody: {
                ...data, stickerExists: !!existing, processingStatus: existing.processingStatus || null, alreadyProcessed, inProgress
            }
        }

    }
    catch (error: any) {

        const { status, message } = mapError(error);
        context.log("Sticker look up failed", message);
        return {
            status,
            jsonBody: {
                message: message
            }
        }

    }

};

app.http('search-sticker', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: searchStickerHandler
});
