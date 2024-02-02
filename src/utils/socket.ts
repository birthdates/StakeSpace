import { REDIS_PUB, getRedisClient } from "./redis";

export const sendMessageToUser = async (userId: string, event: string, data: any) => {
  const subData = {
    type: "send_to_socket",
    data: {
      userId,
      event,
      data,
    },
  };
  const client = await getRedisClient();
  await client.publish(REDIS_PUB, JSON.stringify(subData));
};
