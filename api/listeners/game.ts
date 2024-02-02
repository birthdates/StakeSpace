import {
  CrateBattle,
  Game,
  isValidType,
  Mines,
  Team,
} from "../../src/utils/games";
import { getRedisClient } from "../../src/utils/redis";
import { finishMineGame, setupMines } from "./mines";
import { io } from "../index";
import {
  addGameHistory,
  addWinnings,
  getAccountData,
  getOthersAccountData,
  getUniqueBots,
  wagerBalance,
} from "../../src/utils/account";
import { Winnings } from "../../src/utils/helpers/games";
import { getCrateBattleWinnings, onNewCrateBattleRound } from "./battle";
import { listener } from "../listener";

export async function getGame(type: string, id: string) {
  if (!isValidType(type)) return;
  const redisClient = await getRedisClient();
  const game = await redisClient.get(`games_${type}_${id}`);
  if (!game) return;
  return JSON.parse(game);
}

export function emitCreated(game: Game) {
  if (!game.private) io.emit(game.type + "_created", game);
}

export async function sendMessageToGame(
  gameId: string,
  event: string,
  data: any,
) {
  io.emit(`${event}_${gameId}`, data);
}

async function getLatestEOSBlock() {
  try {
    const res = await fetch("https://eos.genereos.io/v1/chain/get_info");
    const json = await res.json();
    if (!json || !json.head_block_num || !json.head_block_id) {
      return getLatestEOSBlock();
    }
    return [json.head_block_num, json.head_block_id];
  } catch (err) {
    return getLatestEOSBlock();
  }
}

async function hasBlockPassed(block: number) {
  const [latest] = await getLatestEOSBlock();
  return latest > block;
}

export async function checkGames() {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys("games_*");
  const promises = keys.map(async (key) => {
    const json = await redisClient.get(key);
    if (!json) return;
    const game = JSON.parse(json) as Game;
    if (game.status === "waiting") {
      if (game.expires < Date.now()) {
        console.log("Call bots to game expired");
        await callsBotsGame(game);
      }
      if (game.teams.find((x) => x.players.length < x.maxPlayers)) return;
      game.status = "starting";
      game.expires = Date.now() + 1000 * 5;
      await saveGame(game);
      await sendMessageToGame(game.id, "starting", {
        start: game.expires,
        teams: game.teams,
      });
      sendGameUpdate(game);
      return;
    }

    if (game.status === "ended") {
      if (!game.savedHistory) {
        game.savedHistory = true;
        await Promise.all([addGameHistory(game), saveGame(game)]);
      }
      if (game.expires < Date.now()) {
        await redisClient.del(key);
      }
      return;
    }

    if (game.expires > Date.now()) return;
    if (
      game.status === "eos" &&
      game.eosBlock &&
      !(await hasBlockPassed(game.eosBlock!))
    ) {
      game.expires = Date.now() + 1000 * 2;
      return;
    }
    if (game.status === "starting" || !game.eosBlock) {
      game.status = "eos";
      const [blockHeight, blockId] = await getLatestEOSBlock();
      game.eosBlock = blockHeight;
      game.serverSeed = blockId;
      game.expires = Date.now() + 1000 * 3;
      await setupGame(game);
      await saveGame(game);
      await sendMessageToGame(game.id, "eos", blockHeight);
      sendGameUpdate(game);
      return;
    }
    await startNextRound(game);
  });
  return Promise.all(promises);
}

async function setupGame(game: Game) {
  switch (game.type) {
    case "mines":
      await setupMines(game as Mines);
      break;
  }
}

export async function callsBotsGame(
  gameData: Game,
  userId?: string,
  teamID?: number,
) {
  if (gameData.creatorId && userId && gameData.creatorId !== userId) return;
  const neededPlayers =
    teamID !== undefined
      ? 1
      : gameData.teams.reduce(
          (acc: number, x: Team) => acc + x.maxPlayers - x.players.length,
          0,
        );
  const unfilledTeams = gameData.teams
    .filter((x) => x.players.length < x.maxPlayers)
    .map((x) => x.id);
  const bots = getUniqueBots(neededPlayers, gameData.teams);
  if (!bots.length) {
    return;
  }
  return (
    await Promise.all(
      bots.map((bot, index) =>
        joinGame(bot.id, gameData, teamID ?? unfilledTeams[index]),
      ),
    )
  )[0];
}

function getWinnings(game: Game): Winnings {
  switch (game.type) {
    case "crate_battle":
      return getCrateBattleWinnings(game as CrateBattle);
    case "mines":
    case "spinner":
      return { wonBalances: [], winningTeams: [], winPerTeam: 0 };
  }
}

function getXpMultiplier(game: Game) {
  let xpMultiplier = 1.0;

  if (
    game.type === "crate_battle" &&
    (game as CrateBattle).mode.includes("p")
  ) {
    xpMultiplier = 0.5;
  }

  return xpMultiplier;
}

async function giveWinnings(game: Game) {
  const { winningTeams, winPerTeam } = getWinnings(game);
  const winPerPlayer = winPerTeam / game.teams[0].maxPlayers;

  const promises = winningTeams.map(async (team) => {
    game.teams[team].players
      .filter((x) => !x.bot)
      .map((x) =>
        addWinnings(x.id, winPerPlayer, false, getXpMultiplier(game)),
      );
  });
  await Promise.all(promises);
}

async function startNextRound(gameData: Game) {
  gameData.status = "in_progress";
  gameData.round++;
  console.log("Starting new round for: ", gameData.id, gameData.round);
  if (gameData.round >= gameData.roundIDs.length) {
    console.log("Game ended");
    gameData.status = "ended";
    gameData.round--;
    gameData.expires = Date.now() + 1000 * 300;
    setTimeout(() => {
      // Increase balance to winners
      giveWinnings(gameData);
    }, 5000);
    gameData.winnings = getWinnings(gameData);
    await saveGame(gameData);
    const finalData: any = { winnings: gameData.winnings };
    if (gameData.type === "crate_battle")
      finalData.wonItems = (gameData as CrateBattle).wonItems;
    await sendMessageToGame(gameData.id, "ended", finalData);
    sendGameUpdate(gameData);
    return gameData;
  }
  await onNewRound(gameData);
  sendGameUpdate(gameData);
  return gameData;
}

export function sendGameUpdate(game: Game) {
  if (game.private) return;
  io.emit(game.type + "_updated", game);
}

async function onNewRound(game: Game) {
  switch (game.type) {
    case "crate_battle":
      return onNewCrateBattleRound(game as CrateBattle);
    case "mines":
      const mines = game as Mines;
      game.status = "ended";
      return finishMineGame(game.creatorId, mines.revealed, true);
    case "spinner":
      break;
  }
}

export async function getAllGames(type: string) {
  if (!isValidType(type)) return;
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys(`games_${type}_*`);
  const promises = keys.map(async (key) => {
    const json = await redisClient.get(key);
    if (!json) return;
    return JSON.parse(json);
  });
  return (await Promise.all(promises)).filter((x) => x);
}

export async function joinGame(userId: string, gameData: Game, teamID: number) {
  const player = await getOthersAccountData(userId);
  if (!player) {
    return;
  }
  const teamWithPlayerAlready = gameData.teams.find(
    (x) => x.players.findIndex((x) => x.id === userId) !== -1,
  );
  if (teamWithPlayerAlready) {
    return;
  }
  const team =
    gameData.teams.find((x) => x.id === teamID) ??
    gameData.teams.find((x: Team) => x.players.length < x.maxPlayers);
  if (!team || team.players.length >= team.maxPlayers) {
    return;
  }
  if (!player.bot) {
    const accountData = await getAccountData(userId);
    if (
      !accountData ||
      !accountData.balance ||
      accountData.balance < gameData.joinCost
    )
      return;
    await wagerBalance(userId, gameData.joinCost);
  }
  team.players.push(player);
  await saveGame(gameData);
  await sendMessageToGame(gameData.id, "player_joined", {
    teams: gameData.teams,
  });
  sendGameUpdate(gameData);
  console.log("Send player joined", player, teamID);
  return gameData;
}

export async function saveGame(gameData: Game, redisClient?: any) {
  if (!redisClient) redisClient = await getRedisClient();
  await redisClient.set(
    `games_${gameData.type}_${gameData.id}`,
    JSON.stringify(gameData),
  );
}

export class GameListeners {
  @listener("get_games")
  async getGames(userID: string, data: any) {
    return await getAllGames(data.game);
  }

  @listener("join_game", true)
  async joinGame(userID: string, data: any) {
    const gameData = await getGame(data.game, data.id);
    if (!gameData) return;
    return await joinGame(userID, gameData, data.team ?? 0);
  }

  @listener("call_bots", true)
  async callBots(userID: string, data: any) {
    const gameData = await getGame(data.game, data.id);
    if (!gameData) return;
    return await callsBotsGame(gameData, userID, data.team);
  }

  @listener("get_game")
  async getGame(userID: string, data: any) {
    return await getGame(data.game, data.id);
  }
}

new GameListeners();
