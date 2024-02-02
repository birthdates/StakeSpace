import { getTickets, Case, getTicket, getItemFromTicket } from "@/utils/cases";
import { NextApiRequest, NextApiResponse } from "next";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const crate: Case = {
    id: "black-white",
    image:
      "https://cdn.discordapp.com/attachments/892918116324085770/978669850710913084/bw.png",
    name: "Black & White",
    price: 100,
    items: [
      {
        id: "big-grin",
        weight: 1,
      },
      {
        id: "plate-carrier-black",
        weight: 12,
      },
      {
        id: "stainless-facemask",
        weight: 22,
      },
      {
        id: "digital-camo-mp5",
        weight: 50,
      },
      {
        id: "ak47-victoria",
        weight: 75,
      },
      {
        id: "jawboy",
        weight: 125,
      },
      {
        id: "panda-rug",
        weight: 160,
      },
      {
        id: "rox-black-vending-machine",
        weight: 555,
      },
      {
        id: "grey-cap",
        weight: 900,
      },
    ],
  };
  const items: any[] = [];
  for (let i = 0; i < 10; i++) {
    const data = getTickets("239508239805", "sdfkljsdkolg", String(i));
    const ticket = getTicket(data[0]);
    const item = getItemFromTicket(crate.items, ticket) as any;
    item.ticket = ticket;
    items.push(item);
  }
  res.json([items]);
};

export default handler;
