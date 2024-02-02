import { NextApiRequest, NextApiResponse } from "next";
import {logout} from "@/utils/account";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(200).send("");
        return;
    }
    // Remove cookie
    res.setHeader("Set-Cookie", `token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    await logout(token);
    res.status(200).redirect("/");
    return;
};

export default handler;
