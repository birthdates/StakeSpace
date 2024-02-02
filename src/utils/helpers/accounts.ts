import { AccountData } from "@/utils/account";

export const getLevel = (xp: number) => {
  return Math.max(Math.floor(Math.pow(xp, 0.28)), 1);
};

export const toHHMMSS = (str: string) => {
  let sec_num: any = parseInt(str, 10); // don't forget the second param
  let hours: any = Math.floor(sec_num / 3600);
  let minutes: any = Math.floor((sec_num - hours * 3600) / 60);
  let seconds: any = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds;
};

export const getBiggestLevelCase = (account: AccountData) =>
  parseInt(
    Object.keys(account.levelCases!)
      .filter((x: any) => account.levelCases![x] > 0)
      .sort((a, b) => parseInt(b) - parseInt(a))[0] ?? "0",
  );

export const LEVELS: number[] = [
  1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 500,
];
export const getXPForLevel = (level: number) => {
  return Math.pow(level, 25 / 7.0);
};
