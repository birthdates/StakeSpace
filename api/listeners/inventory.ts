import { listener } from "../listener";
import { getCombinedInventory, getUserInventoryItems } from "../bots";
import { makeTrade } from "../../src/utils/trade";
import { mapItems } from "../../src/utils/items";

export class InventoryListeners {
  @listener("get_withdraw_items", true)
  async getWithdrawItems() {
    return await getCombinedInventory();
  }

  @listener("withdraw_items", true)
  async withdrawItems(userID: string, data: any) {
    return await makeTrade(userID, data.items);
  }

  @listener("deposit_items", true)
  async depositItems(userID: string, data: any) {
    return await makeTrade(userID, data.items, true);
  }

  @listener("get_inventory_items", true, 30)
  async getInventoryItems(userID: string) {
    try {
      return await getUserInventoryItems(userID);
    } catch {
      return "FAIL";
    }
  }

  @listener("map_items", false, 300)
  async mapItems(userID: string, data: any) {
    return await mapItems(data.items);
  }
}

new InventoryListeners();
