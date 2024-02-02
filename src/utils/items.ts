import { getDatabase } from "./mongodb";
import { getRedisClient } from "./redis";
import { roundToSecondDecimal } from "./helpers/games";

const getWithdrawPrice = (marketPrice: number) => {
  const price = marketPrice * 1.35;
  // Round to second decimal
  return roundToSecondDecimal(price);
};

export const getDepositPrice = (marketPrice: number) => {
  // Round to second decimal
  return roundToSecondDecimal(marketPrice * 1.15);
};

export const getIDFromName = (name: string) => {
  return name.replace(/ /g, "-").toLowerCase();
};

export const getItemPrice = (itemID: string) => {
  return getItem(itemID).then((item) => item?.price ?? 0);
};

export const getItemsByName = async (itemNames: string[]) => {
  const database = await getDatabase();
  const items = (await database
    .collection("items")
    .find({ name: { $in: itemNames } })
    .toArray()) as any;
  return items as MarketItem[];
};

export const getItemPrices = async (itemNames: string[], deposit?: boolean) => {
  const items = await getItemsByName(itemNames);
  return items.map((item) =>
    deposit ? getDepositPrice(item.price!) : getWithdrawPrice(item.price!),
  );
};

export type Item = {
  id: string;
  name?: string;
  imageURL?: string;
};

export type MarketItem = Item & {
  price?: number;
  withdrawPrice?: number;
  color?: string;
  depositPrice?: number;
  unstable?: boolean;
};

export type GameItem = Item & {
  price?: number;
  roll?: number;
};

export async function getItemWithPrice(id: string, price?: number) {
  const item = await getItem(id);
  if (!item) return undefined;
  if (price) item.price = price;
  return item;
}

export async function getItem(id: string) {
  const database = await getDatabase();
  const item: MarketItem = (await database
    .collection("items")
    .findOne({ id })) as any;
  if (!item) return undefined;
  item.depositPrice = getDepositPrice(item.price!);
  item.withdrawPrice = getWithdrawPrice(item.price!);
  return item;
}

export async function mapItems(items: any[]) {
  await getAllItems();
  const result = items
    .slice(0, Math.min(items.length, 50))
    .map(async (x: any) => {
      const item = (await getItemWithPrice(x.id, x.price))!;
      return { ...x, ...item };
    });
  return await Promise.all(result);
}

export async function getAllItems(ret?: boolean) {
  const redis = await getRedisClient();
  const nextUpdate = await redis.get("next_item_update");
  const database = await getDatabase();
  if (nextUpdate === null || parseInt(nextUpdate) < Date.now()) {
    let items: any = await database.collection("items").find({}).toArray();
    items = await getMarketItems();
    // Delete all items from database that aren't in items
    const ids = items.map((item: any) => item.id);
    await database.collection("items").deleteMany({ id: { $in: ids } });
    // Remove duplicate IDs
    items = items.filter((item: any, index: number) => {
      return items.findIndex((i: any) => i.id === item.id) === index;
    });

    await database.collection("items").insertMany(items);

    await redis.set("next_item_update", Date.now() + 1000 * 60 * 30);
  }
  if (ret)
    return (await database
      .collection("items")
      .find({})
      .toArray()) as any as MarketItem[];
}

export const getMarketItems = async () => {
  const url = `https://api.steamapis.com/market/items/252490?api_key=${process.env.STEAM2_API_KEY}`;
  const res = await fetch(url);
  const { data } = await res.json();
  let result: MarketItem[] = [];

  for (const item of data) {
    // Make ID of item.market_name and replace all spaces with - and make lowercase
    const id = getIDFromName(item.market_name);
    const marketItem: MarketItem = {
      id,
      name: item.market_name,
      imageURL: item.image,
      price: item.prices?.safe_ts?.last_30d ?? 0,
      unstable: item.prices?.unstable,
    };
    marketItem.depositPrice = getDepositPrice(marketItem.price!);
    marketItem.withdrawPrice = getWithdrawPrice(marketItem.price!);
    result.push(marketItem);
  }

  return result;
};
