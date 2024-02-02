import { Case, CaseItem } from "@/utils/cases";
import {getWeight, getWeightString} from "@/utils/helpers/cases";
import { formatNumber, getItemColor } from "@/utils/helpers/items";
import Image from "next/image";
import clsx from "clsx";

export function CaseItemPreview({item, crate, height, width}: {item: CaseItem, crate: Case, height?: number, width?: number}) {
  return (<div
      className="secondary relative radial-color h-full"
      style={
        {
          "--color": `rgb(${getItemColor(item.price! / crate.price, item.price!)})`,
        } as any
      }
  >
    <div className="z-10 flex flex-col items-center justify-center relative h-full">
      <div className={clsx("relative", {
          "w-[40%] h-[40%] mb-5": !height || !width,
      })}>
          {height && width ? (
              <Image
                  src={item.imageURL!}
                  height={height}
                  width={width}
                  alt={item.name!}
                  className="mt-5"
              />
          ) : (
              <Image
                  src={item.imageURL!}
                  fill
                  alt={item.name!}
                  className="mt-5"
              />
          )}
      </div>
      <span
          className="text-md overflow-ellipsis whitespace-nowrap overflow-hidden w-[80%] text-center"
          style={{
            color: `rgb(${getItemColor(item.price! / crate.price, item.price!)})`,
          }}
      >
                {item.name}
              </span>
      <span className={clsx("flex flex-row", {
          "mb-3": height && width,
      })}>
                <Image
                    src="/images/currency.webp"
                    width={20}
                    height={10}
                    alt="Currency"
                />
                <span className="text-md ml-2 font-bold">{formatNumber(item.price!)}</span>
              </span>

      <span className={clsx(
          "text-sm absolute top-[0.5rem] right-[0.5rem]",
          {"shadow-color": getWeight(crate, item.id) <= 500}
      )}>
        {getWeightString(crate, item.id)}
      </span>
    </div>
  </div>);
}

export function CasePreview({
  crateItems,
  crate,
    height, width
}: {
  crateItems: CaseItem[];
  crate: Case;
height?: number;
width?: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-10 w-full h-full">
      {crateItems
        .sort((a, b) => b.price! - a.price!)
        .map((item, num) => (
            <CaseItemPreview height={height} width={width} key={num} item={item} crate={crate} />
        ))}
    </div>
  );
}
