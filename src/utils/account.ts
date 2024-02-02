import bcrypt from "bcrypt";
import { getRedisClient } from "./redis";
import { getDatabase } from "./mongodb";
import { sendMessageToUser } from "./socket";
import {
  getNotifications,
  giveNotification,
  Notification,
} from "./notifications";
import { Game, Team } from "./games";
import { roundToSecondDecimal } from "./helpers/games";
import { CaseItem } from "./cases";
import { getLevel, LEVELS } from "./helpers/accounts";
import { TradeOffer } from "./trade";
import { randomBytes } from "crypto";

export const generateSessionToken = () => {
  // Use bcrypt
  return bcrypt.genSaltSync(10);
};

export const giveSessionToken = async (userId: string) => {
  const token = generateSessionToken();
  // Delete all tokens that point to userId
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys(`session:${userId}:*`);
  if (keys.length) await redisClient.del(keys);
  // Set the new token
  await Promise.all([
    redisClient.set(`session:${userId}:${token}`, "1"),
    redisClient.set(`session:${token}`, userId),
  ]);
  return token;
};

export const logout = async (token: string) => {
  const redisClient = await getRedisClient();
  await redisClient.del(`session:${token}`);
};

export const getUserId = async (token: string) => {
  const redisClient = await getRedisClient();
  return await redisClient.get(`session:${token}`);
};

export const getSteamData = async (userId: string) => {
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${userId}`,
  );
  try {
    const data = await res.json();
    return {
      displayName: data.response.players[0].personaname,
      profilePicture: data.response.players[0].avatarfull,
    };
  } catch (err) {
    throw new Error("Invalid steam data");
  }
};

export const getRandomClientSeed = () => {
  return randomBytes(32).toString("hex");
};

const BOTS: AccountData[] = [
  {
    id: "bot1",
    displayName: "Professional Zuiy",
    profilePicture:
      "https://media.discordapp.net/attachments/696895029398077471/1132515053485174864/zuiy2.png",
    bot: true,
  },
  {
    id: "bot2",
    displayName: "GBO Gaston",
    profilePicture:
      "https://cdn.discordapp.com/attachments/696895029398077471/1132515054114324563/ZUIY1.png",
    bot: true,
  },
  {
    id: "bot3",
    displayName: "Shirtless Zuiy",
    profilePicture:
      "https://cdn.discordapp.com/attachments/696895029398077471/1132515054370173089/zuiy3.png",
    bot: true,
  },
  {
    id: "bot4",
    displayName: "Zuiy 4",
    profilePicture:
      "https://cdn.discordapp.com/attachments/696895029398077471/1132515054370173089/zuiy3.png",
    bot: true,
  },
  {
    id: "bot5",
    displayName: "Zuiy 5",
    profilePicture:
      "https://cdn.discordapp.com/attachments/696895029398077471/1132515054370173089/zuiy3.png",
    bot: true,
  },
  {
    id: "beast",
    displayName: "MrBeast",
    profilePicture: "https://i.imgur.com/1FAgF6c.png",
  },
];

export const getUniqueBots = (amount: number, teams: Team[]) => {
  const bots = [...BOTS].filter(
    (x) =>
      teams.find((y) => y.players.find((z) => z.id === x.id)) === undefined,
  );
  const result: AccountData[] = [];
  for (let i = 0; i < amount; i++) {
    const bot = bots[Math.floor(Math.random() * bots.length)];
    result.push(bot);
    bots.splice(bots.indexOf(bot), 1);
  }
  return result;
};

export const getAccountData = async (userId: string, other?: boolean) => {
  const bot = BOTS.find((x) => x.id === userId);
  if (bot) return bot;
  const steamData = await getSteamData(userId);
  const mongoDatabase = await getDatabase();
  let accountData: any = await mongoDatabase
    .collection("accounts")
    .findOne({ id: userId });
  if (!accountData) {
    accountData = {
      id: userId,
      balance: 0,
      tradeOffers: [],
      wagered: 0,
      xp: 0,
      level: 1,
      won: 0,
      levelCases: {},
      levelCaseCooldown: 0,
      totalRewardsClaimed: 0,
      clientSeed: getRandomClientSeed(),
      transactions: [],
      gameHistory: [],
      wagerAmountBeforeWithdraw: 0,
      ...steamData,
    };
    await mongoDatabase.collection("accounts").insertOne(accountData);
  }
  accountData.level = getLevel(accountData.xp);
  if (!other) accountData.notifications = await getNotifications(userId);
  return {
    ...steamData,
    ...accountData,
  } as AccountData;
};

export const increaseWagered = async (userId: string, amount: number) => {
  const mongoDatabase = await getDatabase();
  await mongoDatabase
    .collection("accounts")
    .updateOne(
      { id: userId },
      { $inc: { wagered: amount, wagerAmountBeforeWithdraw: -amount } },
    );
};

export const wagerBalance = async (userId: string, amount: number) => {
  // increase xp based off amount
  return (
    await Promise.all([
      increaseBalance(userId, -amount),
      increaseWagered(userId, amount),
    ])
  )[0];
};

export const giveLevelCase = async (userId: string, level: number) => {
  const nearestLevel =
    LEVELS.sort((a, b) => b - a).find((x) => level >= x) ?? 1;
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase.collection("accounts").findOneAndUpdate(
    { id: userId },
    {
      $inc: { [`levelCases.${nearestLevel}`]: 1 },
      $set: { levelCaseCooldown: 0 },
    },
    { returnDocument: "after" },
  );
  return doc.value?.levelCases;
};

export const addGameHistory = async (game: Game) => {
  const mongoDatabase = await getDatabase();
  const toUpdate = game.teams
    .map((x) => x.players)
    .flat()
    .map((x) => x.id);
  await mongoDatabase.collection("accounts").updateMany(
    { id: { $in: toUpdate } },
    {
      $push: {
        gameHistory: game,
      } as any,
    },
  );
};

export const giveXP = async (userId: string, amount: number) => {
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase
    .collection("accounts")
    .findOneAndUpdate(
      { id: userId },
      { $inc: { xp: amount } },
      { returnDocument: "before" },
    );
  const beforeXP = doc.value?.xp ?? 0;
  const level = getLevel(beforeXP);
  const newLevel = getLevel(beforeXP + amount);
  if (newLevel !== level) {
    const levelCases = await giveLevelCase(userId, newLevel);
    await Promise.all([
      giveNotification(userId, {
        type: "info",
        message: `You have leveled up to level ${newLevel}!`,
        save: true,
      }),
      sendMessageToUser(userId, "newLevel", {
        level: newLevel,
        levelCases,
        levelCaseCooldown: 0,
      }),
    ]);
  }
};

export const updateTransactionStatus = async (
  userId: string,
  id: string,
  status: string,
  complete?: boolean,
) => {
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase.collection("accounts").findOneAndUpdate(
    { id: userId, "transactions.id": id },
    {
      $set: {
        "transactions.$.status": status,
      },
    },
  );
  if (!doc.value) return;
  const transaction = doc.value.transactions.find(
    (x: any) => x.id === id,
  ) as Transaction;
  if (!transaction) return;
  const promises: Promise<any>[] = [
    giveNotification(userId, {
      type: "success",
      message: complete
        ? `${transaction.cause} has been completed.`
        : `${transaction.cause} is ${status}.`,
      save: true,
    }),
    sendMessageToUser(userId, "transactions", doc.value!.transactions),
  ];
  if (complete) {
    if (transaction.type === "deposit") {
      promises.push(increaseBalance(userId, transaction.amount));
    }
  }
  await Promise.all(promises);
};

export const addTransaction = async (
  userId: string,
  id: string,
  type: string,
  amount?: number,
  defaultStatus?: string,
  deposit?: boolean,
) => {
  if (!amount) return;
  const transaction: Transaction = {
    cause: type,
    userID: userId,
    type: deposit ? "deposit" : "withdrawal",
    id,
    status: defaultStatus,
    amount,
    date: new Date(),
  };
  const mongoDatabase = await getDatabase();
  await mongoDatabase.collection("accounts").updateOne(
    { id: userId },
    {
      $push: {
        transactions: transaction,
      },
    },
  );
  const { transactions } = await getAccountData(userId);
  const promises: Promise<any>[] = [
    mongoDatabase.collection("accounts").updateOne(
      { id: userId },
      {
        $push: {
          transactions: transaction,
        },
      },
    ),
    giveNotification(userId, {
      type: "success",
      message: `${type} has been created.`,
      save: true,
    }),
    sendMessageToUser(userId, "transactions", transactions),
  ];
  if (type === "withdraw") {
    promises.push(increaseBalance(userId, -amount));
  }
  await Promise.all(promises);
};

export const addBalanceBeforeWithdraw = async (
  userId: string,
  amount: number,
) => {
  const mongoDatabase = await getDatabase();
  await mongoDatabase.collection("accounts").updateOne(
    { id: userId },
    {
      $inc: {
        wagerAmountBeforeWithdraw: amount,
      },
    },
  );
};

export const increaseBalance = async (userId: string, amount: number) => {
  amount = roundToSecondDecimal(amount);
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase
    .collection("accounts")
    .findOneAndUpdate(
      { id: userId },
      { $inc: { balance: amount } },
      { returnDocument: "after" },
    );
  await sendMessageToUser(userId, "balanceUpdate", doc.value?.balance ?? 0);
};

export const addWinnings = async (
  userId: string,
  amount: number,
  reward?: boolean,
  xpMultiplier: number = 1,
) => {
  // Increase winnings and give bal
  const mongoDatabase = await getDatabase();
  await mongoDatabase.collection("accounts").updateOne(
    { id: userId },
    {
      $inc: {
        won: amount,
        ...(reward ? { totalRewardsClaimed: amount } : {}),
      },
    },
  );
  await increaseBalance(userId, amount);
  const xpGiven =
    Math.floor(Math.pow(amount, 1.5) + amount * 0.5) * xpMultiplier;
  await giveXP(userId, xpGiven);
};

export const removeLevelCase = async (
  userId: string,
  level: number,
): Promise<[number, LevelCases] | false> => {
  // Return true if the level case is already > 0 and was removed
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase
    .collection("accounts")
    .findOne({ id: userId });
  if (!doc?.levelCases?.[level]) return false;
  const cooldown = Date.now() + 1000 * 60 * 60 * 12;
  const newDoc = await mongoDatabase.collection("accounts").findOneAndUpdate(
    { id: userId },
    {
      $inc: { [`levelCases.${level}`]: -1 },
      $set: {
        levelCaseCooldown: cooldown,
      },
    },
    { returnDocument: "after" },
  );
  return [cooldown, newDoc.value?.levelCases];
};

export const isValidTradeURL = (tradeURL: string) => {
  const regex =
    /https?:\/\/steamcommunity.com\/tradeoffer\/new\/\?partner=(\d+)&token=(.{8})$/g;
  return regex.test(tradeURL);
};

export const isValidEmail = (email: string) => {
  const regex = /\S+@\S+\.\S+/g;
  return regex.test(email);
};

export const updateAccountData = async (
  userId: string,
  data: Partial<AccountData>,
) => {
  const mongoDatabase = await getDatabase();
  await mongoDatabase.collection("accounts").updateOne(
    { id: userId },
    {
      $set: data,
    },
  );
  return 1;
};

export const isAdmin = async (token?: string) => {
  if (!token) return false;
  const userId = await getUserId(token);
  if (!userId) return false;
  const mongoDatabase = await getDatabase();
  const doc = await mongoDatabase
    .collection("accounts")
    .findOne({ id: userId });
  return doc?.admin ?? false;
};

export const getOthersAccountData = async (userId: string) => {
  const accountData = await getAccountData(userId, true);
  if (accountData.transactions) delete accountData.transactions;
  if (accountData.gameHistory) delete accountData.gameHistory;
  if (accountData.tradeURL) delete accountData.tradeURL;
  if (accountData.email) delete accountData.email;
  if (accountData.clientSeed) delete accountData.clientSeed;
  if (accountData.wagerAmountBeforeWithdraw)
    delete accountData.wagerAmountBeforeWithdraw;
  if (accountData.levelCases) delete accountData.levelCases;
  if (accountData.levelCaseCooldown) delete accountData.levelCaseCooldown;
  if (accountData.notifications) delete accountData.notifications;
  if (accountData.xp) delete accountData.xp;
  if (accountData.affiliateEarnings) delete accountData.affiliateEarnings;
  if (accountData.affiliateCode) delete accountData.affiliateCode;
  if (accountData.codeUsing) delete accountData.codeUsing;
  return accountData;
};

export type Transaction = {
  amount: number;
  userID: string;
  date: Date;
  status?: string;
  type: "deposit" | "withdrawal";
  cause: string;
  id: string;
};

// Level -> number of cases map
export type LevelCases = {
  [key: number]: number;
};

export type AccountData = {
  balance?: number;
  profilePicture?: string;
  bot?: boolean;
  levelCases?: LevelCases;
  levelCaseCooldown?: number;
  displayName?: string;
  tradeOffers?: TradeOffer[];
  totalRewardsClaimed?: number;
  leaderboardEarnings?: number;
  affiliateEarnings?: number;
  affiliateCode?: string;
  codeUsing?: string;
  bestRewardClaimed?: CaseItem;
  xp?: number;
  notifications?: Notification[];
  level?: number;
  email?: string;
  id: string;
  tradeURL?: string;
  wagered?: number;
  won?: number;
  admin?: boolean;
  clientSeed?: string;
  wagerAmountBeforeWithdraw?: number;
  transactions?: Transaction[];
  gameHistory?: Game[];
};
