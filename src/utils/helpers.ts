export const isSplitRight = (splitCost: {NIC: number, BROWNCARD: number, cost: number}): boolean => {

    return Number(splitCost.NIC) + Number(splitCost.BROWNCARD) === Number(splitCost.cost);

}

export function mapError(error: any): {status: number, message: string}{
  const status = error.response?.status ?? 500;
  const message = error.response?.data?.message || error.message || "Something went wrong";
  return { status, message };
}