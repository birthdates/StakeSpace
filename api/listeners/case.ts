import { listener } from "../listener";
import {
  AccountData,
  addWinnings,
  getAccountData,
  removeLevelCase,
  wagerBalance,
} from "../../src/utils/account";
import { getBiggestLevelCase } from "../../src/utils/helpers/accounts";
import {
  getAllCases,
  getCrate,
  getEOSHash,
  getItemFromTicket,
  getTicket,
  getTicketsWithHash,
} from "../../src/utils/cases";
import { mapItems, MarketItem } from "../../src/utils/items";
import { getRedisClient } from "../../src/utils/redis";
import { MAX_CASES } from "../../src/utils/helpers/cases";

export async function checkForCaseOpenExpiry() {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys("crate_openings_*");
  const promises = keys.map(async (key) => {
    const data = await redisClient.get(key);
    if (!data) return;
    const { expiry } = JSON.parse(data);
    const userId = key.split("_")[2];
    const caseId = key.split("_")[3];
    if (expiry < Date.now()) {
      await finishCaseOpening(caseId, userId, true);
    }
  });
  return Promise.all(promises);
}

async function finishCaseOpening(
  caseId: string,
  userId: string,
  override?: boolean,
) {
  const redisClient = await getRedisClient();
  const runningCase = await redisClient.get(
    `crate_openings_${userId}_${caseId}`,
  );
  if (!runningCase) {
    return;
  }
  const runningCaseData = JSON.parse(runningCase);
  await redisClient.del(`crate_openings_${userId}_${caseId}`);
  if (!override && runningCaseData.expiry < Date.now()) {
    return;
  }
  const wonBalance = runningCaseData.wonItems.reduce(
    (acc: number, item: MarketItem) => {
      return acc + item.price!;
    },
    0,
  );
  await addWinnings(userId, wonBalance);
}

async function lookForRunningCase(caseId: string, userId: string) {
  const redisClient = await getRedisClient();
  // Find running case for user
  const runningCase = await redisClient.get(
    `crate_openings_${userId}_${caseId}`,
  );
  if (!runningCase) return null;
  const runningCaseData = JSON.parse(runningCase);
  if (runningCaseData.expiry < Date.now()) {
    return;
  }
  return runningCaseData;
}

async function openCase(
  caseId: string,
  userId: string,
  amount: number,
  demo: boolean = false,
) {
  if ((!userId && !demo) || amount > MAX_CASES) return;
  const crate = await getCrate(caseId);
  if (!crate) return;
  const price = crate.price * amount;
  if (!demo) {
    const runningCase = await lookForRunningCase(caseId, userId);
    if (runningCase) return;
  }
  let accountData: AccountData | undefined;
  if (!demo) {
    accountData = await getAccountData(userId);
    if (!accountData || accountData.balance! < price) return;
  }
  let wonItems: MarketItem[] = [];
  let roundIDs: string[] = [];
  let finalTickets: number[] = [];

  let serverSeed: string = await getEOSHash();
  for (let i = 0; i < amount; i++) {
    const roundId = String(i);
    let [tickets] = getTicketsWithHash(
      accountData?.clientSeed ?? "GUEST",
      userId ?? "GUEST",
      roundId,
      serverSeed,
    );
    const ticket = getTicket(tickets);

    const item = await getItemFromTicket(crate.items, ticket);
    wonItems.push(item!);
    roundIDs.push(roundId);
    finalTickets.push(ticket);
  }
  if (!demo) {
    const redisClient = await getRedisClient();
    const redisPromise = redisClient.set(
      `crate_openings_${userId}_${caseId}`,
      JSON.stringify({
        serverSeed,
        roundIDs,
        expiry: Date.now() + 1000 * 30,
        startTime: Date.now(),
        wonItems,
        tickets: finalTickets,
      }),
    );
    await Promise.all([redisPromise, wagerBalance(userId, price)]);
  }
  return { wonItems, tickets: finalTickets, serverSeed, roundIDs };
}

async function openLevelCase(userId: string) {
  const accountData = await getAccountData(userId);
  if (!accountData || (accountData.levelCaseCooldown ?? 0) > Date.now()) {
    return;
  }
  const biggestLevel = getBiggestLevelCase(accountData);
  if (biggestLevel <= 0) return;
  const data = await removeLevelCase(userId, biggestLevel);
  if (data === false) return;
  const crate = await getCrate({ $exists: true }, biggestLevel);
  if (!crate) {
    return;
  }
  crate.items = await mapItems(crate.items);
  const serverSeed = await getEOSHash();
  const roundId = "0";
  const item = await getItemFromTicket(
    crate.items,
    getTicket(
      getTicketsWithHash(
        accountData.clientSeed!,
        userId,
        roundId,
        serverSeed,
      )[0],
    ),
  );
  if (!item) return;
  setTimeout(async () => await addWinnings(userId, item.price!, true), 5000);
  return {
    serverSeed,
    roundId,
    item,
    crate,
    cooldown: data[0],
    levelCases: data[1],
  };
}

export class CaseListeners {
  @listener("open_level_case", true, undefined, undefined, 0.1)
  async openPlayerLevelCase(userID: string) {
    return await openLevelCase(userID);
  }

  @listener("get_level_case", true, 100)
  async getLevelCase(userID: string, data: any) {
    return await getCrate({ $exists: true }, data.level ?? 0);
  }

  @listener("all_cases", false, 300)
  async getAllCases() {
    return await getAllCases();
  }

  @listener("finish_case", true)
  async finishCase(userID: string, data: any) {
    await finishCaseOpening(data.crate, userID);
  }

  @listener("running_case", true)
  async getRunningCase(userID: string, data: any) {
    return await lookForRunningCase(data.crate, userID);
  }

  @listener("open_case", true, undefined, undefined, 0.3)
  async openCase(userID: string, data: any) {
    return await openCase(data.crate, userID, data.amount, data.demo);
  }
}

new CaseListeners();
