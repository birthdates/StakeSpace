import { getAllItems, mapItems } from "@/utils/items";
import CaseEditor from "@/components/cases/admin/CaseEditor";
import { getCrate } from "@/utils/cases";

export default async function EditCase({ params }: { params: { id: string } }) {
  const items = await getAllItems(true);
  const crate = await getCrate(params.id, {});
  crate.items = await mapItems(crate.items);
  return <CaseEditor items={items!} crate={crate} />;
}
