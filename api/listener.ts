import { giveNotification } from "../src/utils/notifications";
import { info } from "../src/utils/log";

export type Listener = {
  id: string;
  cacheSeconds: number;
  callsPerSecond?: number;
  func: any;
  requireID?: boolean;
  globalCache?: boolean;
  limitMap: RateLimit;
  cacheMap: {
    [key: string]: {
      expiry: number;
      result: any;
    };
  };
};

export type RateLimit = {
  [key: string]: {
    expiry: number;
    count: number;
  };
};

export type Listeners = {
  [key: string]: Listener;
};

export const listeners: Listeners = {};

export const callListener = async (
  id: string,
  userID: string,
  ip: string,
  data: any,
) => {
  const listener = listeners[id];
  if (!listener || (listener.requireID && !userID)) return;
  let cacheKey = listener.globalCache ? "global" : ip;
  cacheKey += data && listener.func.length >= 2 ? JSON.stringify(data) : "";
  const cache = listener.cacheMap[cacheKey];
  if (cache && cache.expiry > Date.now()) {
    return cache.result;
  }

  if (listener.callsPerSecond) {
    const limit = listener.limitMap[ip];
    const per = Math.min(listener.callsPerSecond, 1);
    if (limit && limit.expiry > Date.now()) {
      limit.count += per;
    } else {
      listener.limitMap[ip] = {
        expiry: Date.now() + 1000 / per,
        count: per,
      };
    }
    if (listener.limitMap[ip].count > listener.callsPerSecond) {
      if (userID)
        await giveNotification(userID, {
          type: "error",
          message: "Try again later.",
        });
      return;
    }
  }

  let result: any;
  if (listener.func[Symbol.toStringTag] === "AsyncFunction") {
    result = await listener.func(userID, data);
  } else {
    result = listener.func(userID, data);
  }

  if (listener.cacheSeconds > 0) {
    listener.cacheMap[cacheKey] = {
      expiry: Date.now() + listener.cacheSeconds * 1000,
      result,
    };
  }
  return result;
};

export function listener(
  id: string,
  requireID?: boolean,
  cacheSeconds?: number,
  globalCache?: boolean,
  callsPerSecond?: number,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    info(`Registered listener ${id}`);
    listeners[id] = {
      id,
      cacheSeconds: cacheSeconds ?? -1,
      cacheMap: {},
      globalCache,
      limitMap: {},
      requireID,
      callsPerSecond,
      func: target[propertyKey],
    };
  };
}
