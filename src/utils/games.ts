import { getItem } from "./items";
import { getRedisClient } from "./redis";
import { Case, CaseItem, getCrate } from "./cases";
import { Winnings } from "./helpers/games";
import { AccountData } from "./account";

export type Team = {
  id: number;
  players: AccountData[];
  maxPlayers: number;
};

export interface Game {
  id: string;
  eosBlock?: number;
  teams: Team[];
  joinCost: number;
  cost: number;
  private: boolean;
  status: GameStatus;
  savedHistory?: boolean;
  expires: number;
  creatorId: string;
  roundIDs: string[];
  serverSeed: string;
  round: number;
  type: GameType;
  partialFunding: number;
  winnings?: Winnings;
  startDate: number;
}

export const CRATE_BATTLE_ROUND_TIME_SECONDS = 7.5;

export type GameType = "crate_battle" | "spinner" | "mines";
export type GameTeamMode =
  | "1v1"
  | "1v1v1"
  | "1v1v1v1"
  | "2v2"
  | "3v3"
  | "2p"
  | "3p"
  | "4p"
  | "1v1v1v1v1"
  | "1v1v1v1v1v1"
  | "5p"
  | "6p";
export type GameStatus =
  | "waiting"
  | "starting"
  | "eos"
  | "in_progress"
  | "ended";

export const isValidType = (type: string): type is GameType => {
  return type === "crate_battle" || type === "spinner";
};

export interface CrateBattle extends Game {
  mode: GameTeamMode;
  type: "crate_battle";
  caseIDs: string[];
  roundStart: number;
  rainbow: boolean;
  terminal?: boolean;
  wonItems: CaseItem[];
  cursed: boolean;
  crates?: Case[];
}

export type Mines = Game & {
  grid?: number[][];
  mines: number;
  bet: number;
  revealed: number[]; // array of indexes
  serverSeed: string;
};

export const fetchCrateBattle = async (battleId: string) => {
  const redisClient = await getRedisClient();
  const battle = await redisClient.get(`games_crate_battle_${battleId}`);
  if (!battle) return;
  const data = JSON.parse(battle) as CrateBattle;
  data.crates = await Promise.all(data.caseIDs.map((x) => getCrate(x)));
  const promises = data.crates.map(async (crate) => {
    crate.items = await Promise.all(
      crate.items.map(async (item) => {
        const marketItem = (await getItem(item.id))!;
        return { ...marketItem, ...item };
      }),
    );
  });
  await Promise.all(promises);
  return data;
};
