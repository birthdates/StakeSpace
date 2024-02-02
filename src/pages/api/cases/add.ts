import { NextApiRequest, NextApiResponse } from "next";
import {isAdmin} from "@/utils/account";
import {createCase} from "@/utils/cases";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("New path");
    const {token} = req.cookies;
    if (!(await isAdmin(token))) {
        res.end();
        return;
    }
    const crate = await createCase(req.body.name);
    res.send(crate.id);
};

export default handler;
