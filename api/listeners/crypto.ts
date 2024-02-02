import { getQRCode, getDepositAddress } from "../crypto";
import { listener } from "../listener";
import { getConversions, updateConversions } from "../../src/utils/crypto";

export class CryptoListeners {
  @listener("get_deposit_address", true, 300)
  async getDepositAddress(userID: string, data: any) {
    const address = await getDepositAddress(data.currency, userID);
    return { address, qrCode: getQRCode(address) };
  }

  @listener("get_conversions", true, 300, true)
  async getConversions(userID: string) {
    return await getConversions();
  }
}

setInterval(updateConversions, 1000 * 60 * 60 * 3);
updateConversions();

new CryptoListeners();
