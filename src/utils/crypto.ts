import { getRedisClient } from "./redis";
import {
  CRYPTO_DEPOSIT_BONUS,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES,
} from "./helpers/crypto";

const API_URL = `https://min-api.cryptocompare.com/data/pricemulti?api_key=${process.env.CRYPTO_COMPARE_KEY}&tsyms=USD`;

export const updateConversions = async () => {
  const redisClient = await getRedisClient();
  const joined = SUPPORTED_CURRENCIES.join(",");
  const data = await fetch(`${API_URL}&fsyms=${joined}`);
  const json = await data.json();
  if (json.error) return;
  const promises = Object.keys(json).map((currency) => {
    return redisClient.setEx(
      `conversion:${currency}`,
      60 * 60 * 24,
      String(json[currency].USD),
    );
  });
  await Promise.all(promises);
};

export const getConversion = async (currency: string) => {
  if (!isSupportedCurrency(currency)) return;
  const redisClient = await getRedisClient();
  const conversion = await redisClient.get(`conversion:${currency}`);
  if (!conversion) return;
  return parseFloat(conversion);
};

export const getConversions = async () => {
  const redisClient = await getRedisClient();
  const promises = SUPPORTED_CURRENCIES.map((currency) => {
    return redisClient.get(`conversion:${currency}`);
  });
  const conversions = await Promise.all(promises);
  // map currencys to a map of currency -> conversion
  const map: { [key: string]: number } = {};
  SUPPORTED_CURRENCIES.forEach((currency, index) => {
    map[currency] = parseFloat(conversions[index] || "0");
  });
  return map;
};

export const convertCurrency = async (
  currency: string,
  amount: number,
  deposit?: boolean,
) => {
  if (!isSupportedCurrency(currency)) return;
  const redisClient = await getRedisClient();
  const conversion = await redisClient.get(`conversion:${currency}`);
  if (!conversion) return;
  return (
    parseFloat(conversion) * amount * (deposit ? CRYPTO_DEPOSIT_BONUS : 0.66)
  );
};
