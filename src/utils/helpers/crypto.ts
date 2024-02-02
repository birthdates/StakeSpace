export const SUPPORTED_CURRENCIES = ["BTC", "ETH", "LTC", "USDT", "BNB"];
export const FULL_CURRENCY_NAMES: {
  [key: string]: string;
} = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  LTC: "Litecoin",
  USDT: "Tether",
  BNB: "Binance Coin",
};

export const CRYPTO_DEPOSIT_BONUS = 1.45;

export const isSupportedCurrency = (currency: string) => {
  return SUPPORTED_CURRENCIES.includes(currency);
};
