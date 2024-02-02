import {
  CRATE_BATTLE_ROUND_TIME_SECONDS,
  CrateBattle,
  GameTeamMode,
} from "../../src/utils/games";
import { MAX_CASE_PER_BATTLE } from "../../src/utils/helpers/cases";
import {
  getAccountData,
  getOthersAccountData,
  wagerBalance,
} from "../../src/utils/account";
import {
  getCases,
  getCrate,
  getEOSHash,
  getItemFromTicket,
  getRandomHash,
  getTicket,
  getTicketsWithHash,
} from "../../src/utils/cases";
import { getTeams } from "../../src/utils/helpers/games";
import { emitCreated, saveGame, sendMessageToGame } from "./game";
import { getItemColor } from "../../src/utils/helpers/items";
import { listener } from "../listener";

async function createCaseBattle(
  userId: string,
  caseIDs: string[],
  cursed: boolean,
  priv: boolean,
  mode: GameTeamMode,
  terminal: boolean,
  partialFunding: number,
  rainbow: boolean,
) {
  if (
    !caseIDs ||
    !mode ||
    !caseIDs.length ||
    caseIDs.length > MAX_CASE_PER_BATTLE ||
    partialFunding === undefined ||
    isNaN(partialFunding) ||
    rainbow === undefined
  ) {
    return;
  }
  partialFunding = Math.max(Math.min(partialFunding, 100), 0) / 100;
  const accountData = await getAccountData(userId);
  if (!accountData) return;
  const cases = await getCases(caseIDs);
  if (!cases || !cases.length) return;
  if (caseIDs.length <= 1 || !mode.includes("v")) {
    terminal = false;
    rainbow = false;
  }
  caseIDs.sort(
    (a, b) =>
      cases.find((x) => x.id === a)!.price -
      cases.find((x) => x.id === b)!.price,
  );
  if (cursed && !mode.includes("v")) cursed = false;
  const host = (await getOthersAccountData(userId))!;
  const teams = getTeams(mode, host);

  let price = caseIDs
    .map((x) => cases.find((y) => y.id === x)?.price ?? 0)
    .reduce((x, acc) => x + acc);
  const totalPlayers = teams
    .map((x) => x.maxPlayers)
    .reduce((x, acc) => x + acc, 0);
  const joinCost = price - price * partialFunding;
  partialFunding = price * partialFunding;
  price += partialFunding * (totalPlayers - 1);
  if (accountData.balance! < price) {
    return;
  }

  const roundIDs = caseIDs.map((x, i) => String(i));

  const game: CrateBattle = {
    id: getRandomHash(),
    rainbow,
    creatorId: userId,
    teams,
    joinCost,
    cost: price,
    private: priv,
    cursed,
    crates: await getCases(caseIDs),
    startDate: Date.now(),
    roundStart: Date.now(),
    partialFunding,
    caseIDs,
    terminal,
    expires: Date.now() + 1000 * (partialFunding > 0 ? 500 : 300),
    mode,
    status: "waiting",
    round: -1,
    roundIDs,
    serverSeed: "",
    wonItems: [],
    type: "crate_battle",
  };
  emitCreated(game);
  await Promise.all([saveGame(game), wagerBalance(userId, price)]);
  return game.id;
}

export function getCrateBattleWinnings(game: CrateBattle) {
  let i = 0;
  let roundIDs = game.roundIDs;
  let wonBalances: number[] = [];
  let lastWonBalances: number[] = [];
  let colors: Set<string>[] = [];
  let lastColors: Set<string>[] = [];
  for (let j = 0; j < roundIDs.length; j++) {
    for (const team of game.teams) {
      let wonBalance = 0;
      let teamColors = [];
      for (const player of team.players) {
        const item = game.wonItems[i++];
        const crateID = game.caseIDs[j];
        const crate = game.crates!.find((x) => x.id === crateID)!;
        teamColors.push(getItemColor(item.price! / crate.price, item.price!));
        wonBalance += item.price!;
      }
      if (wonBalances[team.id]) {
        wonBalances[team.id] += wonBalance;
      } else {
        wonBalances[team.id] = wonBalance;
      }
      let set = colors[team.id];
      if (!set) colors[team.id] = set = new Set(teamColors);
      else teamColors.forEach((x) => set.add(x));

      if (roundIDs.length - 1 === j) {
        lastWonBalances[team.id] = wonBalance;
        lastColors[team.id] = new Set(teamColors);
      }
    }
  }
  let winningTeams: number[];
  const balances = game.terminal ? lastWonBalances : wonBalances;
  if (game.mode.includes("v")) {
    // Find all the teams with the highest balance (tied)
    const list = game.rainbow
      ? (game.terminal ? lastColors : colors).map((x) => x.size)
      : balances;
    console.log(list, game.rainbow);
    const winner = game.cursed ? Math.min(...list) : Math.max(...list);
    winningTeams = game.teams
      .filter((x, index) => list[index] === winner)
      .map((x) => x.id);
  } else {
    winningTeams = game.teams.map((x) => x.id); // Everyone wins, equal split
  }
  let totalWonBalance = wonBalances.reduce((acc, x) => acc + x, 0);
  let winPerTeam = totalWonBalance / winningTeams.length;
  return { wonBalances, winningTeams, winPerTeam };
}

export async function onNewCrateBattleRound(gameData: CrateBattle) {
  const roundId = gameData.roundIDs[gameData.round];
  const serverSeed = gameData.serverSeed;
  const crate = await getCrate(gameData.caseIDs[gameData.round]);
  const promises = gameData.teams.map((team) => {
    return Promise.all(
      team.players.map(async (accountData) => {
        const tickets: number[] = getTicketsWithHash(
          accountData.clientSeed ?? accountData.id,
          accountData.id,
          roundId,
          serverSeed,
        )[0];
        const ticket = getTicket(tickets);
        const item = await getItemFromTicket(crate.items, ticket);
        gameData.wonItems.push(item!);
      }),
    );
  });
  await Promise.all(promises);
  gameData.roundStart = Date.now();
  gameData.expires =
    gameData.roundStart + CRATE_BATTLE_ROUND_TIME_SECONDS * 1000;
  await Promise.all([
    saveGame(gameData),
    sendMessageToGame(gameData.id, "new_round", {
      round: gameData.round,
      wonItems: gameData.wonItems,
      start: gameData.roundStart,
      expires: gameData.expires,
    }),
  ]);
}

export class BattleListeners {
  @listener("create_case_battle", true, undefined, undefined, 0.3)
  async createCaseBattle(userID: string, data: any) {
    return await createCaseBattle(
      userID,
      data.crates,
      data.cursed,
      data.priv,
      data.mode,
      data.terminal,
      data.partialFunding,
      data.rainbow,
    );
  }
}

new BattleListeners();
