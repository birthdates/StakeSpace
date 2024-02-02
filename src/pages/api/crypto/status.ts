import { NextApiRequest, NextApiResponse } from "next";
import { addTransaction, updateTransactionStatus } from "@/utils/account";
import * as crypto from "crypto";
import { convertCurrency } from "@/utils/crypto";
import { success } from "@/utils/log";

export const config = {
  api: {
    bodyParser: false,
  },
};

const merchantID = process.env.COIN_MERCHANT_ID as string;
const ipnSecret = process.env.COIN_IPN_SECRET as string;

const statusToMessage = (status: number): string => {
  switch (status) {
    case 1:
    case 0:
      return "Awaiting funds";
    case -2:
      return "Refunded";
    case -1:
      return "Expired";
    case 100:
    case 2:
      return "Received funds";
    case 5:
      return "Escrow received funds";
    case 3:
      return "Pending via PayPal";
  }
  return "Awaiting funds";
};

const isValidHMAC = (body: string, merchant: string, HMAC: string): boolean => {
  if (merchant !== merchantID) return false;
  const hmac = crypto.createHmac("sha512", ipnSecret);
  hmac.update(body);
  return hmac.digest("hex") === HMAC;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.redirect("/");
    return;
  }

  let buffer = "";
  req.on("data", (chunk) => {
    buffer += chunk;
  });
  req.on("end", async () => {
    const HMAC: string = req.headers.hmac as string;
    const merchant = (buffer.match(/(?<=merchant=).+?(?=&|\/)/g) || [])[0];
    const txn_id = (buffer.match(/(?<=txn_id=).*/g) || [])[0];
    const status = (buffer.match(/(?<=status=).+?(?=&|\/)/g) || [])[0];
    const amount = (buffer.match(/(?<=amount2=).+?(?=&|\/)/g) || [])[0];
    const label = (buffer.match(/(?<=label=).+?(?=&|\/)/g) || [])[0];
    const currency = (buffer.match(/(?<=currency2=).+?(?=&|\/)/g) || [])[0];

    // If HMAC is invalid, return
    if (!HMAC || !isValidHMAC(buffer, merchant!, HMAC)) {
      console.log("Invalid HMAC", buffer, merchant, HMAC);
      res.status(400).json({});
      return;
    }

    if (status !== "2" && status !== "100") {
      res.status(200).send("OK");
      return;
    }

    const balance = await convertCurrency(currency!, parseFloat(amount!), true);

    success(
      `Crypto Deposit of $${balance} has been made (${amount} ${currency})`,
    );
    // Label is userID
    await addTransaction(
      label!,
      txn_id!,
      `${amount} ${currency} Deposit`,
      balance,
      "Completed",
      true,
    );
    await updateTransactionStatus(
      label!,
      txn_id!,
      `${amount} ${currency} Deposit`,
      true,
    );
    res.status(200).send("OK");
  });
}
