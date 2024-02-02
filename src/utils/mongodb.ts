import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!, {});

export const getDatabase = async () => {
  await client.connect();
  return client.db("gamble");
};

export const getMongoClient = () => {
  return client;
};
