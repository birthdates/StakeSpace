import { giveSessionToken } from "@/utils/account";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const queryParameters = req.query;
  let steamAuthLoginUrl = `https://steamcommunity.com/openid/login`;
  queryParameters["openid.mode"] = "check_authentication";
  steamAuthLoginUrl += `?${new URLSearchParams(queryParameters as any).toString()}`;
  const response = await fetch(steamAuthLoginUrl);
  const text = await response.text();
  if (!text.includes("is_valid:true")) {
    res.status(401).redirect("/api/login");
    return;
  }
  const claimedId = queryParameters["openid.claimed_id"] as string;
  if (!claimedId) {
    res.status(401).redirect("/api/login");
    return;
  }
  const userId = claimedId.split("/").pop()!;
  const token = await giveSessionToken(userId);
  // Set cookie
  res.setHeader(
    "Set-Cookie",
    `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
  );
  res.redirect("/");
};

export default handler;
