import { fetchCrateBattle } from "@/utils/games";
import CrateBattle from "@/components/battle/CrateBattle";
import { redirect } from "next/navigation";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Case Battle",
};
export default async function CrateBattlePage({
  params,
}: {
  params: { id: string };
}) {
  const battle = await fetchCrateBattle(params.id);
  if (!battle) {
    return redirect("/cases/battle");
  }

  return <CrateBattle battle={battle} />;
}
