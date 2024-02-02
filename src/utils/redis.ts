import { createClient } from "redis";

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  url: process.env.REDIS_HOST,
});
export const REDIS_PUB = "G_CHANNEL";

export const getRedisClient = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
};
