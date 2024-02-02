import { MarketItem } from "../items";

export const getItemColor = (percentage: number, price: number) => {
  if (price >= 400) return "255, 221, 89";
  if (price >= 90) return "235, 77, 75";
  if (price < 1 && percentage < 1) return "207, 215, 223";
  if (percentage <= 1) return "118, 185, 199";
  if (percentage <= 10) return "100, 191, 129";
  if (percentage <= 20) return "174, 110, 238";
  if (percentage <= 100) return "235, 77, 75";
  return "255, 221, 89";
};

export const formatNumber = (price: number, digits?: number) => {
  if (!price || isNaN(price) || typeof price !== "number") {
    price = 0;
  }
  const str = price.toFixed(digits ?? 2);
  // Format with commas
  return str.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

export const isBigWin = (wonItems: MarketItem[], price: number): number[] => {
  // true if any wonItems price > price
  const ret: number[] = [];
  for (let index = 0; index < wonItems.length; index++) {
    const item = wonItems[index];
    if (item.price! > price) ret.push(index);
  }
  return ret;
};
