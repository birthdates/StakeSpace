import { getDatabase } from "./mongodb";
import { getItemWithPrice, MarketItem } from "./items";
import { createHash, createHmac } from "crypto";
import { getRedisClient } from "./redis";

export interface Case {
  id: string;
  name: string;
  price: number;
  image: string;
  tags: string[];
  level?: number;
  items: CaseItem[];
}

export const TICKETS_PER_CASE = 1;
export const SPINS = 50;

export type CaseItem = MarketItem & {
  weight: number;
};

export const getEOSHash = async () => {
  // pop from set of txids
  const redisClient = await getRedisClient();
  const txid = await redisClient.sPop("eos-txids", 1);
  return txid[0];
};

export const getItemFromTicket = async (items: CaseItem[], ticket: number) => {
  let currentWeight = 0;
  let result = items[items.length - 1];
  // Sort by price descending
  items.sort((a, b) => b.price! - a.price!);
  for (const item of items) {
    currentWeight += item.weight;
    if (ticket <= currentWeight) {
      result = item;
      break;
    }
  }
  return (await getItemWithPrice(result.id, result.price)) as CaseItem;
};

export const getCrate = async (crateId: any, level?: any) => {
  const data = await getDatabase();
  const crate = (await data.collection("crates").findOne({
    id: crateId,
    ...(!level
      ? { level: { $exists: false } }
      : typeof level === "object"
      ? level
      : { level }),
  })) as any;
  if (crate) delete crate._id;
  return crate as Case;
};

export const getTicket = (tickets: number[]) =>
  tickets[Math.min(SPINS - 1, TICKETS_PER_CASE - 1)];

export const getRandomHash = () =>
  createHash("sha256")
    .update(String(performance.now() + performance.timeOrigin))
    .digest("hex")
    .slice(0, 10);

export const getTickets = async (
  clientSeed: string,
  userId: string,
  roundId: string,
): Promise<[number[], string]> => {
  const serverSeed = await getEOSHash();
  return getTicketsWithHash(clientSeed, userId, roundId, serverSeed);
};

export const getSpecificTicketsWithHash = (
  minTicket: number,
  clientSeed: string,
  userId: string,
  roundId: string,
  serverSeed: string,
): [number[], string] => {
  // Using getTicketsWithHash, generate tickets until the target ticket is found RIGGING
  let tickets: number[] = [];
  while (!tickets.length || !tickets.find((x) => x <= minTicket)) {
    [tickets] = getTicketsWithHash(clientSeed, userId, roundId, serverSeed);
  }
  return [tickets, serverSeed];
};

function* byteGenerator({
  serverSeed,
  entropy,
  nonce,
  cursor,
  roundID,
}: {
  serverSeed: string;
  entropy: string;
  nonce: string;
  roundID: string;
  cursor: number;
}) {
  // Setup curser variables
  let currentRoundCursor = cursor;

  // Generate outputs until cursor requirement fullfilled
  // HMAC function used to output provided inputs into bytes
  const hmac = createHmac("sha256", serverSeed);
  hmac.update(`${entropy}:${nonce}:${roundID}`);
  const buffer = hmac.digest();

  // Update cursor for next iteration of loop
  while (currentRoundCursor < 32) {
    yield Number(buffer[currentRoundCursor]);
    currentRoundCursor += 1;
  }
}

const chunk = (arr: number[], n: number) =>
  arr
    .slice(0, ((arr.length + n - 1) / n) | 0)
    .map((c, i) => arr.slice(n * i, n * i + n));

export const getTicketsWithHash = (
  clientSeed: string,
  userId: string,
  roundId: string,
  serverSeed: string,
  max?: number,
): [number[], string] => {
  // Using cryptography, generate a random number using crypto.ts library between 0-1000. Generate TICKETS_PER_CASE of these tickets
  const tickets: number[] = [];
  const rng = byteGenerator({
    serverSeed,
    entropy: clientSeed,
    nonce: userId,
    roundID: roundId,
    cursor: 0,
  });
  while (tickets.length < TICKETS_PER_CASE * 4) {
    tickets.push(<number>rng.next().value);
  }
  return [
    chunk(tickets, 4).map(
      (bytesChunk) =>
        bytesChunk.reduce((result, value, i) => {
          const divider = 256 ** (i + 1);
          const partialResult = value / divider;
          return result + partialResult;
        }, 0) * (max ?? 10000),
    ),
    serverSeed,
  ];
};

export const replaceCrate = async (id: string, crate: Case) => {
  const newId = crate.id;
  const data = await getDatabase();
  const collection = data.collection("crates");
  if (id !== newId) {
    await collection.deleteOne({ id });
    await collection.deleteOne({ id: crate.id });
    await collection.insertOne(crate);
  } else await collection.replaceOne({ id }, crate);
};

export const createCase = async (name: string) => {
  // Create id with name lowercase and spaces replaced with dashes
  const id = name.toLowerCase().replace(/ /g, "-");
  const crate: Case = {
    id,
    name,
    price: 0,
    image: "",
    tags: [],
    items: [],
  };
  const database = await getDatabase();
  await database.collection("crates").insertOne(crate);
  return crate;
};

export const getAllCases = async (includeLevel?: boolean) => {
  const data = await getDatabase();
  const filter = includeLevel ? {} : { level: { $exists: false } };
  const cases = (await data
    .collection("crates")
    .find(filter)
    .toArray()) as any[];
  return cases as Case[];
};

export const getCases = async (ids: string[]) => {
  const data = await getDatabase();
  const cases = (await data
    .collection("crates")
    .find({ id: { $in: ids }, level: { $exists: false } })
    .toArray()) as any[];
  return cases as Case[];
};
