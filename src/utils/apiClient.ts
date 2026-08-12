import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.NIC_BASE_URL
const apiKey = process.env.NIC_API_KEY


export const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Authorization': `x-api-key ${apiKey}`,
        'Content-Type': 'application/json'
    }


})

