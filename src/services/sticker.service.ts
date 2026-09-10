import { apiClient } from "../utils/apiClient";
import { ApproveStickerInput, NicResponse, StickerRequest } from "../types/sticker";
import { InvocationContext } from "@azure/functions";

// so lets connect to nic api and then to the search sticker endpoint

export const searchSticker = async (transactionReference: string) => {
    // try {
    //     const { data } = await apiClient.get<NicResponse<StickerRequest>>(`/sticker/search/${transactionReference}/search`);
    //     return data;

    // }
    try {
        const response = await apiClient.get<NicResponse<StickerRequest>>(`/sticker/search/${transactionReference}/search`);
        console.log("Response from searchSticker:", response.data);
        return response.data;
        
    }
    catch(error: any) {
        console.log("Error search for sticker:", error.response?.data ?? error.message);
        throw new Error("Failed to search for sticker");

    }

}

export const approveSticker = async (input: ApproveStickerInput) => {

    try {

        const { data} = await apiClient.post<NicResponse<unknown>>(`/sticker/approve`,
            {data: input},
        );
        return data;

    }
    catch(error: any) {
        console.log("Error approving sticker:", error.response?.data ?? error.message);
        throw new Error("Failed to process sticker");
    }
}

// after here, we need another service to handle the spliting of the funds between NIC and brown card