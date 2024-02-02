// Use redis for notifications key: user_id:notif_id (expiry in 1 day)

import { getRedisClient } from "./redis";
import { sendMessageToUser } from "./socket";

export type NotificationType = "error" | "success" | "info" | "warning";

export type Notification = {
  type: NotificationType;
  message: string;
  save?: boolean;
};

export const giveNotification = async (
  userId: string,
  notification: Notification,
) => {
  const redisClient = await getRedisClient();
  const promises: Promise<any>[] = [
    sendMessageToUser(userId, "notification", notification),
  ];
  if (notification.save) {
    promises.push(
      redisClient.setEx(
        `notification:${userId}:${Math.random().toString()}`,
        60 * 15, // 15 minutes
        JSON.stringify(notification),
      ),
    );
  }
  await Promise.all(promises);
};

export const notEnoughBalance = (userId: string) => {
  return giveNotification(userId, {
    type: "error",
    message: "Not enough balance.",
  });
};

export const readAllNotifications = async (userId: string) => {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys(`notification:${userId}:*`);
  if (keys.length) await redisClient.del(keys);
};

export const getNotifications = async (userId: string) => {
  const redisClient = await getRedisClient();
  const keys = await redisClient.keys(`notification:${userId}:*`);
  if (!keys.length) return [];
  const notifications = await redisClient.mGet(keys);
  return notifications.map((notification) =>
    JSON.parse(notification!),
  ) as Notification[];
};
