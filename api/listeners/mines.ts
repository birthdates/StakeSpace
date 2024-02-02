import { Mines } from "../../src/utils/games";
import { getGame, saveGame } from "./game";
import { listener } from "../listener";
import {
  getMinesMultiplier,
  MIN_MINES_BET,
  MINE_GRID_SIZE,
} from "../../src/utils/helpers/games";
import {
  addWinnings,
  getAccountData,
  increaseWagered,
} from "../../src/utils/account";
import {
  getEOSHash,
  getRandomHash,
  getTicketsWithHash,
} from "../../src/utils/cases";
import { getRedisClient } from "../../src/utils/redis";

async function getActiveMines(userId: string) {
  const game = await getGame("mines", userId);
  if (!game) return;
  return game as Mines;
}

export async function setupMines(mines: Mines) {
  const accountData = await getAccountData(mines.creatorId);
  const roundId = "0";
  const grid: number[][] = [];
  for (let i = 0; i < MINE_GRID_SIZE; i++) {
    grid[i] = Array(MINE_GRID_SIZE).fill(0);
  }
  const possibilities = Array(grid.length ** 2)
    .fill(0)
    .map((_, i) => i);
  for (let i = 0; i < mines.mines; i++) {
    const index = getTicketsWithHash(
      accountData.clientSeed!,
      mines.creatorId,
      roundId,
      mines.serverSeed,
      possibilities.length,
    )[0][0];
    const x = Math.floor(possibilities[index] / grid.length);
    const y = possibilities[index] % grid.length;
    grid[x][y] = 1;
    possibilities.splice(index, 1);
  }
  mines.status = "in_progress";
  mines.expires = Date.now() + 1000 * 60 * 30;
}

async function createsMineGame(
  userId: string,
  betAmount: number,
  mines: number,
) {
  betAmount = Math.max(betAmount, MIN_MINES_BET);
  const accountData = await getAccountData(userId);
  if (accountData.balance! < betAmount) return;
  mines = Math.max(Math.min(mines, 24), 1);
  const serverHash = await getEOSHash();
  const game: Mines = {
    id: getRandomHash(),
    type: "mines",
    joinCost: 0,
    private: true,
    status: "starting",
    partialFunding: 0,
    startDate: Date.now(),
    round: -1,
    cost: betAmount,
    expires: 0,
    creatorId: userId,
    grid: [],
    teams: [
      {
        maxPlayers: 1,
        players: [accountData],
        id: 0,
      },
    ],
    mines,
    bet: betAmount,
    revealed: [],
    serverSeed: serverHash,
    roundIDs: ["0"],
  };
  const redisClient = await getRedisClient();
  await Promise.all([
    saveGame(game, redisClient),
    increaseWagered(userId, betAmount),
  ]);

  return { serverSeed: serverHash, roundID: "0" };
}

async function revealMine(userId: string, x: number, y: number) {
  const active = await getActiveMines(userId);
  if (!active) return;
  const { grid, revealed, mines } = active;
  if (revealed.includes(x * grid!.length + y)) return;
  revealed.push(x * grid!.length + y);
  if (grid![x][y] === 1) {
    return finishMineGame(userId, revealed, false);
  }
  if (revealed.length === grid!.length ** 2 - mines) {
    return finishMineGame(userId, revealed, true);
  }
  await saveGame(active);
  return revealed;
}

export async function finishMineGame(
  userId: string,
  revealed: number[],
  won: boolean,
) {
  const active = await getActiveMines(userId);
  if (!active) return;
  const { grid, mines, bet, serverSeed, roundIDs } = active;
  if (won) {
    await addWinnings(userId, bet * getMinesMultiplier(mines, revealed.length));
  }
  active.status = "ended";
  await saveGame(active);
  return { grid, mines, bet, serverSeed, roundID: roundIDs[0], won };
}

export class MinesListeners {
  @listener("get_mines", true)
  async getMines(userID: string) {
    const result = await getActiveMines(userID);
    if (result) delete result.grid;
  }

  @listener("create_mines", true)
  async createMines(userID: string, data: any) {
    const active = await getActiveMines(userID);
    if (active) return active;
    return await createsMineGame(userID, data.bet, data.mines);
  }

  @listener("reveal_mine", true)
  async revealMine(userID: string, data: any) {
    return await revealMine(userID, data.x, data.y);
  }

  @listener("cash_mines", true)
  async cashMines(userID: string) {
    const active = await getActiveMines(userID);
    if (!active) return;
    return await finishMineGame(userID, active.revealed, true);
  }
}

new MinesListeners();
