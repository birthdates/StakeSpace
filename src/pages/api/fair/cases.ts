import { getAccountData, getUserId } from "@/utils/account";
import {
  getCrate,
  getItemFromTicket,
  getTicket,
  getTicketsWithHash,
} from "@/utils/cases";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { serverSeed, roundId, crate, clientSeed } = req.query;
  const { token } = req.cookies;
  if (!serverSeed || !roundId || !token || !crate) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const userId = await getUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userData = await getAccountData(userId);
  if (!userData) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const crateData = await getCrate(crate as string);
  const data = getTicketsWithHash(
    (clientSeed as string) ?? userData.clientSeed,
    userId,
    roundId as string,
    serverSeed as string
  );
  const ticket = getTicket(data[0]);
  const item = getItemFromTicket(crateData.items, ticket) as any;
  item.ticket = ticket;
  res.status(200).json(item);
};

export default handler;
