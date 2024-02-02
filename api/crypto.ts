import { isSupportedCurrency } from "../src/utils/helpers/crypto";
import * as crypto from "crypto";

const API_URL = `https://www.coinpayments.net/api.php`;

export const getQRCode = (address: string) => {
  return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${address}&choe=UTF-8&chld=L|1`;
};

export const generateHMAC = (params: string) => {
  const hmac = crypto.createHmac(
    "sha512",
    process.env.COINPAYMENTS_PRIVATE_KEY!,
  );
  hmac.update(params);
  return hmac.digest("hex");
};

export const getDepositAddress = async (currency: string, userID: string) => {
  if (!isSupportedCurrency(currency)) return;
  currency = "LTCT";
  const params = `version=1&cmd=get_callback_address&key=${process.env.COINPAYMENTS_PUBLIC_KEY}&format=json&currency=${currency}&label=${userID}`;
  const data = await fetch(`${API_URL}`, {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      HMAC: generateHMAC(params),
    },
  });
  const json = await data.json();
  if (json.error !== "ok")
    throw new Error(`Failed to get address: ${JSON.stringify(json)}`);
  return json.result.address;
};
