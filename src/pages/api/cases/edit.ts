import { NextApiRequest, NextApiResponse } from "next";
import {isAdmin} from "@/utils/account";
import {replaceCrate} from "@/utils/cases";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

    const {token} = req.cookies;
    if (!(await isAdmin(token))) {
        res.end();
        return;
    }
    await replaceCrate(req.body.id, req.body.crate);
    res.send("OK");
};

export default handler;
