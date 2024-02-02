import { getAllCases } from "@/utils/cases";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cases",
};

export default async function CasesPage() {
  const cases = await getAllCases();
  cases.sort((a, b) => b.price - a.price);

  return (
    <div className="grid grid-cols-3 gap-4 mt-5">
      {cases.map((c, num) => (
        <Link key={num} href={`/cases/${c.id}`}>
          <div className="flex flex-col select-none items-center justify-center hover-scale secondary rounded-xl p-3">
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{c.name}</span>
              <span className="flex flex-row">
                <Image
                  src="/images/currency.webp"
                  width={30}
                  height={20}
                  alt="Currency"
                />
                <span className="text-xl ml-2 font-bold">
                  {c.price.toFixed(2)}
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Image alt={c.name} src={c.image} width={150} height={150} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
