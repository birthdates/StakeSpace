import { getAccountData, getUserId } from "@/utils/account";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(200).send("");
    return;
  }
  const userId = await getUserId(token);
  if (!userId) {
    // Remove cookie
    res.setHeader(
      "Set-Cookie",
      `token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    );
    res.status(200).send("");
    return;
  }

  const data = await getAccountData(userId);
  res.status(200).json(data);
};

export default handler;
