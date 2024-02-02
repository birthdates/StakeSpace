"use client";

import { MarketItem } from "@/utils/items";
import { Case, CaseItem } from "@/utils/cases";
import Image from "next/image";
import { useMemo, useState } from "react";
import ItemListModal from "@/components/cases/admin/ItemListModal";
import Loading from "@/components/Loading";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import Back from "@/components/Back";
import { formatNumber, getItemColor } from "@/utils/helpers/items";

export default function CaseEditor({
  items,
  crate,
}: {
  items: MarketItem[];
  crate: Case;
}) {
  const [crateItems, setCrateItems] = useState<CaseItem[]>(crate.items);
  const [showModal, setShowModal] = useState(false);
  const [crateName, setCrateName] = useState(crate.name);
  const [crateImage, setCrateImage] = useState(crate.image);
  const [id, setId] = useState(crate.id);
  const [cratePrice, setCratePrice] = useState(crate.price);
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState(crate.level);
  const totalWeight = useMemo(
    () => crateItems.map((x) => x.weight!).reduce((x, acc) => x + acc, 0),
    [crateItems],
  );
  const showWarning = useMemo(() => totalWeight != 10000, [totalWeight]);
  const suggestedPrice = useMemo(
    () =>
      crateItems
        .map((x) => x.price! * (x.weight! / 10000))
        .reduce((x, acc) => x + acc, 0) * 1.2,
    [crateItems],
  );

  const deleteItem = (index: number) => {
    const newItems = [...crateItems];
    newItems.splice(index, 1);
    setCrateItems(newItems);
  };

  const setCrateLevel = (level: number) => {
    setLevel(level === -1 ? undefined : level);
  };

  const changeItemPrice = (index: number, price: number) => {
    const newItems = [...crateItems];
    newItems[index].price = price;
    setCrateItems(newItems);
  };

  const changeItemWeight = (index: number, weight: number) => {
    const newItems = [...crateItems];
    newItems[index].weight = weight;
    setCrateItems(newItems);
  };

  const addItem = (marketItem: MarketItem) => {
    if (crateItems.find((item) => item.id === marketItem.id))
      return alert("Item already in crate!");
    const newItems = [...crateItems];
    newItems.push({
      id: marketItem.id,
      price: marketItem.price,
      weight: 1,
      imageURL: marketItem.imageURL,
      name: marketItem.name,
    });
    setCrateItems(newItems);
  };

  const save = async () => {
    const newCrate = { ...crate };
    newCrate.name = crateName;
    newCrate.image = crateImage;
    newCrate.price = cratePrice;
    newCrate.items = crateItems;
    newCrate.id = id;
    newCrate.level = level;
    setLoading(true);
    await fetch("/api/cases/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: crate.id, crate: newCrate }),
    });
    setLoading(false);
  };

  return (
    <div
      className={
        "flex flex-col p-4 secondary items-center justify-center mt-12"
      }
    >
      <div className={"flex flex-row w-full "}>
        <Back src={"/cases/admin/create"} title={"Create"} />
      </div>
      {showModal && (
        <ItemListModal
          items={items}
          onExit={() => setShowModal(false)}
          onSelect={addItem}
        />
      )}

      <div className={"w-full flex-row justify-evenly items-center"}>
        <label htmlFor={"name"}>Name</label>
        <input
          type={"text"}
          placeholder={"Name"}
          defaultValue={crateName}
          className={"w-full p-2 bg-zinc-800 mt-2"}
          onChange={(e) => setCrateName(e.target.value)}
        />
        <label htmlFor={"name"}>ID</label>
        <input
          type={"text"}
          placeholder={"ID"}
          defaultValue={id}
          className={"w-full p-2 bg-zinc-800 mt-2"}
          onChange={(e) => setId(e.target.value)}
        />
        <label htmlFor={"image"}>Image</label>
        <input
          type={"text"}
          placeholder={"Image"}
          defaultValue={crateImage}
          className={"w-full p-2 bg-zinc-800 mt-2"}
          onChange={(e) => setCrateImage(e.target.value)}
        />
        <label htmlFor={"price"}>Price</label>
        <input
          type={"number"}
          placeholder={"Price"}
          defaultValue={cratePrice}
          className={"w-full p-2 bg-zinc-800 mt-2"}
          onChange={(e) => setCratePrice(parseFloat(e.target.value))}
        />
        <label htmlFor={"level"}>Level (-1 to remove)</label>
        <input
          type={"number"}
          placeholder={"Level"}
          defaultValue={level ?? -1}
          className={"w-full p-2 bg-zinc-800 mt-2"}
          onChange={(e) => setCrateLevel(parseInt(e.target.value))}
        />
      </div>

      {showWarning && (
        <div className={"bg-zinc-800 p-3 w-full mt-5"}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={"text-2xl text-yellow-300"}
          />
          <span className={"font-bold ml-3"}>
            Warning: The total weight of all items in this crate is not equal to
            10,000 (100%). This means that the odds of getting each item will be
            skewed. The current total weight is {totalWeight} (100% is 10,000).
          </span>
        </div>
      )}

      <div className={"bg-zinc-800 p-3 w-full mt-5 flex items-center"}>
        <FontAwesomeIcon
          icon={faInfoCircle}
          className={"text-2xl text-blue-300"}
        />
        <span className={"ml-3"}>
          Suggested Price:{" "}
          <span className={"font-bold"}>{formatNumber(suggestedPrice)}</span>
        </span>
      </div>

      <div className={"grid grid-cols-6 gap-3 mt-10"}>
        {crateItems.map((item, index) => (
          <div key={item.id} className={"flex flex-col items-center"}>
            <Image
              src={item.imageURL!}
              alt={item.name!}
              height={80}
              width={80}
            />
            <label htmlFor={"name"} className={"mt-3"}>
              Weight ({formatNumber(item.weight! / 100)}%)
            </label>
            <input
              type={"number"}
              placeholder={"Weight"}
              defaultValue={item.weight}
              onChange={(e) =>
                changeItemWeight(index, parseInt(e.target.value))
              }
              className={"w-full p-2 bg-zinc-800 mt-2"}
            />
            <label htmlFor={"name"}>Price</label>
            <input
              type={"number"}
              placeholder={"Price"}
              onChange={(e) =>
                changeItemPrice(index, parseFloat(e.target.value))
              }
              defaultValue={item.price}
              className={"w-full p-2 bg-zinc-800 mt-2"}
            />
            <button
              className={"mt-3 bg-red-500 w-full p-3 hover-scale"}
              onClick={() => deleteItem(index)}
            >
              DELETE
            </button>
          </div>
        ))}
        <div
          className={"flex flex-col items-center justify-center w-full h-full"}
        >
          <button
            className={"p-3 font-bold text-3xl hover-scale"}
            onClick={() => setShowModal(true)}
          >
            ADD ITEM
          </button>
        </div>
      </div>
      <button
        className={
          "mt-3 bg-green-400 p-3 font-bold text-2xl w-full hover-scale"
        }
        onClick={save}
      >
        {loading && <Loading />}
        <span className={clsx({ "opacity-0": loading })}>SAVE</span>
      </button>
    </div>
  );
}
