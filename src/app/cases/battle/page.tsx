import CaseBattleListPage from "@/components/battle/CaseBattleListPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Battles",
};

export default function BattlePage() {
  return <CaseBattleListPage />;
}
