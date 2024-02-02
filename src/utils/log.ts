// USing chalk

import chalk from "chalk";

export const info = (message: string) => {
  console.log(chalk.white.bgBlue(message));
};

export const error = (message: string) => {
  console.log(chalk.white.bgRed(message));
};

export const success = (message: string) => {
  console.log(chalk.white.bgGreen(message));
};

export const warn = (message: string) => {
  console.log(chalk.white.bgYellow(message));
};
