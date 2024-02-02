import { getRedisClient } from "./redis";
import { getDatabase } from "./mongodb";
import { getAccountData } from "./account";
import { giveNotification, notEnoughBalance } from "./notifications";
import { getItemPrices } from "./items";
import { sendMessageToUser } from "./socket";

export type TradeOffer = {
  botID?: string;
  userID: string;
  id: string;
  failed: number;
  deposit?: boolean;
  targetItems: string[]; // market hash names
  amount: number;
};

export const addTradeOffer = async (userID: string, offer: TradeOffer) => {
  const redisClient = await getRedisClient();
  const database = await getDatabase();
  const databasePromise = database.collection("accounts").updateOne(
    { id: userID },
    {
      $inc: { balance: offer.amount * (offer.deposit ? 0 : -1) },
      $push: { tradeOffers: offer },
    },
  );
  const redisPromise = redisClient.setEx(
    `tradeOffer:${offer.id}`,
    60 * 25,
    JSON.stringify(offer),
  );
  await Promise.all([redisPromise, databasePromise]);
  const account = await getAccountData(userID);
  await Promise.all([
    sendMessageToUser(userID, "balanceUpdate", account.balance ?? 0),
    giveNotification(userID, {
      type: "success",
      message: `Trade offer ${offer.id} has been created.`,
      save: true,
    }),
  ]);
  return account.tradeOffers as TradeOffer[];
};

export const makeTrade = async (
  userID: string,
  targetItems: string[],
  deposit?: boolean,
) => {
  const accountData = await getAccountData(userID);
  const amount = (await getItemPrices(targetItems, deposit)).reduce(
    (x, acc) => x + acc,
    0,
  );
  if (!accountData.tradeURL) {
    await giveNotification(userID, {
      type: "error",
      message: "You must set your trade URL before you can make a trade.",
    });
    return "FAIL";
  }
  if (amount <= 0 || (!deposit && accountData.balance! < amount)) {
    return notEnoughBalance(userID);
  }

  if ((accountData.wagerAmountBeforeWithdraw ?? 0) > 0) {
    await giveNotification(userID, {
      type: "error",
      message:
        "You must wager $" +
        accountData.wagerAmountBeforeWithdraw?.toFixed(2) +
        " before you can withdraw.",
    });
    return "FAIL";
  }
  const randomID = Math.random().toString(36).substring(6).toUpperCase();
  const tradeOffer: TradeOffer = {
    userID,
    failed: 0,
    deposit,
    targetItems,
    id: randomID,
    amount,
  };
  return addTradeOffer(userID, tradeOffer);
};
