import {getAllCases} from "@/utils/cases";
import CaseCreator from "@/components/cases/admin/CaseCreator";

export default async function CreateAdmin() {
    const crates = await getAllCases(true);

    return <CaseCreator crates={crates} />
}