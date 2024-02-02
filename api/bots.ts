import SteamUser from "steam-user";
import SteamTotp from "steam-totp";
import SteamCommunity from "steamcommunity";
import TradeOfferManager from "steam-tradeoffer-manager";
import * as fs from "fs";
import { getRedisClient } from "../src/utils/redis";
import { TradeOffer } from "../src/utils/trade";
import CEconItem from "steamcommunity/classes/CEconItem";
import {
  getDepositPrice,
  getIDFromName,
  getItemPrice,
  getItemPrices,
  getItemsByName,
  MarketItem,
} from "../src/utils/items";
import { error, info, success, warn } from "../src/utils/log";
import {
  addTransaction,
  getAccountData,
  increaseBalance,
  addBalanceBeforeWithdraw,
  updateTransactionStatus,
} from "../src/utils/account";
import { giveNotification } from "../src/utils/notifications";

const bots: Bot[] = [];

type SteamAccount = {
  username: string;
  password: string;
  sharedSecret: string;
  identitySecret: string;
};

type Bot = {
  client: SteamUser;
  community: SteamCommunity;
  manager: TradeOfferManager;
  inventory: CEconItem[];
};

export const updateInventories = () => {
  return Promise.all(bots.map(updateInventory));
};

export const updateInventory = async (bot: Bot) => {
  info(`Updating inventory for: ${bot.client.accountInfo?.name}...`);
  bot.manager.getInventoryContents(252490, 2, true, (err, inventory) => {
    if (err) return console.log(err);
    bot.inventory = inventory;
    success(`Updated inventory for: ${bot.client.accountInfo?.name}.`);
  });
};

export const findBotWithMostItems = async (
  itemNames: string[],
): Promise<[Bot, CEconItem[]]> => {
  // Find the bot that contains the most of these items
  const itemAmounts = await getTempItems();
  const mapped = bots.map((bot) => {
    const items = bot.inventory.filter((item) =>
      itemNames.includes(item.market_hash_name),
    );
    filterTempItems(items, itemAmounts);
    return items.length;
  });
  const max = Math.max(...mapped);
  const index = mapped.indexOf(max);
  return [
    bots[index],
    bots[index].inventory.filter((item) =>
      itemNames.includes(item.market_hash_name),
    ),
  ];
};

export const getTempItems = async () => {
  const redisClient = await getRedisClient();
  const tempItems = await redisClient.sMembers("temp_items");
  const itemAmounts: { [key: string]: number } = {};
  tempItems.forEach((item) => {
    if (!itemAmounts[item]) itemAmounts[item] = 0;
    itemAmounts[item]++;
  });
  return itemAmounts;
};

export const filterTempItems = (
  items: CEconItem[],
  itemAmounts: { [p: string]: number },
) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (itemAmounts[item.name] && itemAmounts[item.name]-- <= 1) {
      delete itemAmounts[item.name];
      items.splice(i, 1);
      i--;
    }
  }
};

export const getCombinedInventory = async () => {
  const items = bots.map((bot) => bot.inventory).flat();
  filterTempItems(items, await getTempItems());
  return await mapToMarketItems(items);
};

export const findBotWithLowestInventory = async () => {
  // Lowest inventory price
  const botsInvPrice = await Promise.all(
    bots.map(async (x) =>
      Promise.all(
        x.inventory.map(
          async (x) => await getItemPrice(getIDFromName(x.market_hash_name)),
        ),
      ),
    ),
  );
  const botsInvPriceSum = botsInvPrice.map((x) => x.reduce((a, b) => a + b, 0));
  const lowestInvPrice = Math.min(...botsInvPriceSum);
  const lowestInv = botsInvPriceSum.indexOf(lowestInvPrice);
  return bots[lowestInv];
};

export const getRandomBot = () => {
  return bots[Math.floor(Math.random() * bots.length)];
};

export const removeItemsTemporarily = async (items: string[]) => {
  const redisClient = await getRedisClient();
  await redisClient.sAdd("temp_items", items);
};

export const addItemsBack = async (items: string[]) => {
  const redisClient = await getRedisClient();
  await redisClient.sRem("temp_items", items);
};

export const mapToMarketItems = async (items: CEconItem[]) => {
  const marketItems = await getItemsByName(
    items.map((x) => x.market_hash_name),
  );

  const allItems: MarketItem[] = [];
  for (const item of items) {
    for (let i = 0; i < item.amount; i++) {
      const marketItem = marketItems.find(
        (x) => x.name === item.market_hash_name,
      )!;
      marketItem.color = item.name_color;
      allItems.push(marketItem);
    }
  }
  return allItems;
};

export const getUserInventoryItems = async (userID: string) => {
  const bot = getRandomBot();

  return new Promise<MarketItem[]>((res, rej) => {
    bot.manager.getUserInventoryContents(
      userID,
      252490,
      2,
      true,
      async (err, items) => {
        if (err) {
          error(`Failed to get inventory for ${userID}: ${err.cause}`);
          return rej(err);
        }

        const allItems: MarketItem[] = await mapToMarketItems(items);
        res(allItems);
      },
    );
  });
};

export const mapItemNames = async (
  itemNames: string[],
  userID: string,
  manager: TradeOfferManager,
): Promise<CEconItem[]> => {
  return new Promise((res, rej) => {
    manager.getUserInventoryContents(userID, 252490, 2, true, (err, items) => {
      if (err) {
        error(`Failed to get inventory for ${userID}: ${err.cause}`);
        return rej(err);
      }
      res(items.filter((x) => itemNames.includes(x.market_hash_name)));
    });
  });
};

export const addOfferWaitingForConfirmation = async (offerID: string) => {
  // Add to redis list
  const redisClient = await getRedisClient();
  await redisClient.setEx(`offers_confirm:${offerID}`, 60 * 25, offerID);
};

export const addOfferWaitingForAccept = async (
  id: string,
  offer: TradeOffer,
) => {
  // Add to redis list
  const redisClient = await getRedisClient();
  await redisClient.set(`waiting_offer:${id}`, JSON.stringify(offer));
};

export const handleDeposit = async (offer: TradeOffer) => {
  const bot = await findBotWithLowestInventory();
  if (!bot) {
    warn("No bots available to create trade offer");
    throw new Error("No bots");
  }
  const { tradeURL } = await getAccountData(offer.userID);
  if (!tradeURL) {
    throw new Error("FAIL: No trade URL");
  }
  const steamOffer = bot.manager.createOffer(tradeURL);
  const items = await mapItemNames(
    offer.targetItems!,
    offer.userID,
    bot.manager,
  );
  steamOffer.addTheirItems(items);
  steamOffer.setMessage(
    `Deposit for ${offer.amount} on BarrelBets (ID: ${offer.id})`,
  );
  await new Promise((res: any, rej) => {
    steamOffer.send(async (err) => {
      if (err) {
        error(`Failed to create offer ${offer.id} for ${offer.userID}: ${err}`);
        rej(error);
        return;
      }
      success(
        `Deposit of $${offer.amount} has been requested and offer created.`,
      );
      Promise.all([
        addTransaction(
          offer.userID,
          steamOffer.id!,
          "Deposit Trade",
          offer.amount,
          "Pending Confirmation",
          true,
        ),
        addOfferWaitingForAccept(steamOffer.id!, offer),
      ]).then(res);
    });
  });
};

export const refundWithdraw = async (offer: TradeOffer, items: string[]) => {
  const prices = await getItemPrices(items);
  const total = prices.reduce((a, b) => a + b, 0);
  await increaseBalance(offer.userID, total);
  return total;
};

export const handleWithdraw = async (offer: TradeOffer) => {
  const items = [...offer.targetItems!];
  while (items.length > 0) {
    const [bot, foundItems] = await findBotWithMostItems(items);
    if (!bot) {
      warn(`Trade offer has items we no longer have! ${JSON.stringify(offer)}`);
      throw new Error("FAIL: Invalid items");
    }
    const { tradeURL } = await getAccountData(offer.userID);
    if (!tradeURL) {
      throw new Error("FAIL: No trade URL");
    }
    const steamOffer = bot.manager.createOffer(tradeURL);
    steamOffer.addMyItems(foundItems);
    steamOffer.setMessage(
      `Withdraw for ${offer.amount} on BarrelBets (ID: ${offer.id})`,
    );

    await new Promise((res: any, rej) => {
      steamOffer.send(async (err) => {
        if (err) {
          error(
            `Failed to create offer ${offer.id} for ${offer.userID}: ${err.cause}`,
          );
          rej(err);
        }
        await Promise.all([
          addOfferWaitingForConfirmation(steamOffer.id!),
          addOfferWaitingForAccept(steamOffer.id!, offer),
          addTransaction(
            offer.userID,
            steamOffer.id!,
            "Skin Withdraw",
            -offer.amount,
            "Pending Confirmation",
          ),
        ]);
        success(
          `Withdraw of $${offer.amount} has been requested and offer created.`,
        );

        res();
      });
    });

    // Remove found items from items
    foundItems.forEach((item) => {
      items.splice(items.indexOf(item.market_hash_name), 1);
    });
  }
  return removeItemsTemporarily(offer.targetItems!);
};

export const checkOnOffers = async () => {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys("tradeOffer:*");
  const allKeys = await Promise.all(keys.map((x) => redisClient.getDel(x)));
  const promises = allKeys
    .map(async (json) => {
      if (!json) return;
      const offer = JSON.parse(json!) as TradeOffer;
      const { tradeURL } = await getAccountData(offer.userID);
      if (!tradeURL) throw new Error("No trade URL");
      return offer.deposit ? handleDeposit(offer) : handleWithdraw(offer);
    })
    .map((promise, index) => {
      promise.catch(async (err: Error) => {
        // Re set the key if it failed
        const data = JSON.parse(allKeys[index]!) as TradeOffer;
        if (
          data.failed++ > 10 ||
          (err.message && err.message.startsWith("FAIL:"))
        ) {
          let total = 0;
          if (!data.deposit) {
            total = await refundWithdraw(data, data.targetItems);
          }
          error(
            `Trade offer failed after 10 attempts (removing): ${JSON.stringify(
              data,
            )} ` + (data.deposit ? "" : `(refunded $${total})`),
          );
          await Promise.all([
            giveNotification(data.userID, {
              type: "error",
              message:
                "Failed to create your trade offer. Please try again later.",
            }),
            addItemsBack(data.targetItems!),
          ]);
          return;
        }
        await redisClient.setEx(keys[index], 60 * 5, JSON.stringify(data));
      });
      return promise;
    });
  await Promise.allSettled(promises);
};

const createClient = (account: SteamAccount) => {
  const client = new SteamUser();
  const community = new SteamCommunity();
  const manager = new TradeOfferManager({
    steam: client,
    community,
    pollInterval: 1000 * 10,
    language: "en",
  });
  client.logOn({
    accountName: account.username,
    password: account.password,
    twoFactorCode: SteamTotp.generateAuthCode(account.sharedSecret),
  });

  client.on("loggedOn", () => {
    client.setPersona(SteamUser.EPersonaState.Online);
    client.gamesPlayed(252490);
  });

  manager.on("sentOfferChanged", async (offer) => {
    if (!offer.id || offer.state === 2) return; // Active trade
    const redisClient = await getRedisClient();
    const offerJSON = await redisClient.get(`waiting_offer:${offer.id}`);

    // Failed / Declined trade
    if (offer.state !== 3 || !offerJSON) {
      if (offerJSON) {
        const offerData = JSON.parse(offerJSON) as TradeOffer;
        const items = (
          offerData.deposit ? offer.itemsToReceive : offer.itemsToGive
        ).map((x) => x.name);
        if (!offerData.deposit) {
          const prices = await getItemPrices(items);
          await Promise.all([
            addItemsBack(items),
            increaseBalance(
              offerData.userID,
              prices.reduce((a, acc) => a + acc, 0),
            ),
          ]);
        }
        await Promise.all([
          updateTransactionStatus(offerData.userID, offer.id!, "Failed", true),
          redisClient.del(`waiting_offer:${offer.id}`),
        ]);
      }
      return;
    }
    const offerData = JSON.parse(offerJSON) as TradeOffer;
    const items = (
      offerData.deposit ? offer.itemsToReceive : offer.itemsToGive
    ).map((x) => x.name);
    let promises: Promise<any>[] = [
      updateTransactionStatus(offerData.userID, offer.id!, "Complete", true),
      redisClient.del(`waiting_offer:${offer.id}`),
      updateInventories(),
    ];
    if (offerData.deposit) {
      promises = [
        ...promises,
        increaseBalance(offerData.userID, offerData.amount),
        addBalanceBeforeWithdraw(offerData.userID, offerData.amount),
      ];
    } else promises.push(addItemsBack(items));
    await Promise.all(promises);
  });

  community.on("newConfirmation", async (conf) => {
    const redisClient = await getRedisClient();
    const offerJSON = await redisClient.getDel(`offers_confirm:${conf.id}`);
    if (!offerJSON) return;
    const offerData = JSON.parse(offerJSON) as TradeOffer;
    const offerID = offerData.id;
    community.acceptConfirmationForObject(
      account.identitySecret,
      conf.id,
      async (err) => {
        if (err) {
          // Add back
          await addOfferWaitingForConfirmation(offerID);
          error(`Failed to accept confirmation for ${offerID}: ${err.cause}`);
          return;
        }
        success(`Accepted confirmation for ${offerID}`);
        await Promise.all([
          updateInventories(),
          updateTransactionStatus(
            offerData.userID,
            offerData.id!,
            "Complete",
            true,
          ),
        ]);
      },
    );
  });

  client.on("webSession", (sid, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
    community.startConfirmationChecker(10 * 10, account.identitySecret);
    const bot = { client, community, manager, inventory: [] } as Bot;
    bots.push(bot);
    updateInventory(bot).then(() => {
      success(`Logged into Steam as ${client.accountInfo!.name}`);
    });
  });
};

const data: any[] = JSON.parse(fs.readFileSync("bot_logins.json", "utf8"));
data.forEach(createClient);

process.on("exit", () => {
  bots.forEach(({ client }) => {
    client.setPersona(SteamUser.EPersonaState.Offline);
    client.gamesPlayed([]);
  });
});

setInterval(checkOnOffers, 1000 * 5);
setInterval(updateInventories, 1000 * 60 * 5);
