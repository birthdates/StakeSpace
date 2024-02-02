import { listener } from "../listener";
import {
  giveNotification,
  readAllNotifications,
} from "../../src/utils/notifications";
import {
  getOthersAccountData,
  isValidEmail,
  isValidTradeURL,
  updateAccountData,
} from "../../src/utils/account";

export class PlayerListeners {
  @listener("read_notifications", true)
  async readAllNotifications(userId: string) {
    await readAllNotifications(userId);
    return "OK";
  }

  @listener("update_clientSeed", true)
  async updateSeed(userId: string, data: any) {
    if (typeof data.value !== "string") return;
    if (data.value.length < 1 || data.value.length > 32) {
      await giveNotification(userId, {
        message: "Invalid client seed (max 32 chars)",
        type: "error",
      });
      return "FAIL";
    }
    return await updateAccountData(userId, {
      clientSeed: data.value,
    });
  }

  @listener("update_tradeURL", true)
  async updateTradeURL(userId: string, data: any) {
    if (typeof data.value !== "string") return;
    if (!isValidTradeURL(data.value)) {
      await giveNotification(userId, {
        message: "Invalid trade URL",
        type: "error",
      });
      return "FAIL";
    }
    return await updateAccountData(userId, { tradeURL: data.value });
  }

  @listener("update_email", true)
  async updateEmail(userId: string, data: any) {
    if (typeof data.value !== "string") return;
    if (!isValidEmail(data.value)) {
      await giveNotification(userId, {
        message: "Invalid email",
        type: "error",
      });
      return "FAIL";
    }
    return await updateAccountData(userId, { email: data.value });
  }

  @listener("get_player_infos", false, 15, true)
  async getPlayersInformation(userID: string, data: any) {
    return await Promise.all(data.ids.map(getOthersAccountData));
  }
}

new PlayerListeners();
