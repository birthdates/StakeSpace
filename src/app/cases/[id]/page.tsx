import CasePage from "@/components/cases/Case";
import { getCrate } from "@/utils/cases";
import { redirect } from "next/navigation";

export default async function CaseOpenPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const crate = await getCrate(id);
  if (!crate) {
    return redirect("/cases");
  }
  return <CasePage crate={crate} />;
}
