import { useSite } from "@/utils/SiteContext";
import { useEffect, useMemo, useState } from "react";
import { MarketItem } from "@/utils/items";
import Modal from "@/components/Modal";
import { formatNumber, getItemColor } from "@/utils/helpers/items";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from "@fortawesome/free-solid-svg-icons";
import Loading from "@/components/Loading";
import Image from "next/image";
import clsx from "clsx";

export default function SkinSelectModal({
  onExit,
  deposit,
}: {
  onExit: Function;
  deposit?: boolean;
}) {
  const site = useSite();
  const [failed, setFailed] = useState(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MarketItem[]>([]);

  const getMarketPrice = useMemo(() => {
    return (item: MarketItem) => {
      if (deposit) return item.depositPrice!;
      return item.withdrawPrice!;
    };
  }, [deposit]);

  const itemTotal = useMemo(
    () => items.reduce((x, acc) => x + getMarketPrice(acc), 0),
    [getMarketPrice, items],
  );
  const selectedTotal = useMemo(
    () => selected.reduce((x, acc) => x + getMarketPrice(acc), 0),
    [getMarketPrice, selected],
  );
  const uniqueItems = useMemo(
    () =>
      items.filter(
        (item, index) => items.findIndex((x) => x.name === item.name) === index,
      ),
    [items],
  );
  const ready = useMemo(
    () => !loading && !failed && items.length,
    [items, failed, loading],
  );

  const itemAmounts = useMemo(() => {
    const amounts: { [key: string]: number } = {};
    items.forEach((item) => {
      if (amounts[item.id!]) amounts[item.id!]++;
      else amounts[item.id!] = 1;
    });
    return amounts;
  }, [items]);

  const selectedAmounts = useMemo(() => {
    const amounts: { [key: string]: number } = {};
    selected.forEach((item) => {
      if (amounts[item.id!]) amounts[item.id!]++;
      else amounts[item.id!] = 1;
    });
    return amounts;
  }, [selected]);

  const hasEnough = useMemo(
    () => deposit || (site.loggedInAs?.balance ?? 0) >= selectedTotal,
    [deposit, selectedTotal, site.loggedInAs?.balance],
  );

  const selectItem = (item: MarketItem) => {
    const amount = selectedAmounts[item.id!];
    if (amount && amount >= itemAmounts[item.id!]) {
      return;
    }
    setSelected([...selected, item]);
  };

  const deselectItem = (item: MarketItem) => {
    // Remove only one of this item from selected
    const index = selected.findIndex((x) => x === item);
    if (index === -1) return;
    setSelected([...selected.slice(0, index), ...selected.slice(index + 1)]);
  };

  const complete = () => {
    if (loadingAction) return;
    setLoadingAction(true);
    site.socketCallback(
      deposit ? "deposit_items" : "withdraw_items",
      (data: any) => {
        setLoadingAction(false);
        if (typeof data === "object") {
          site.setLoggedInAs!({ ...site.loggedInAs, tradeOffers: data } as any);
        }
        onExit();
      },
      {
        items: selected.map((x) => x.name),
      },
    );
  };

  useEffect(() => {
    if (!loading) return;
    setItems([]);
    setFailed(false);
    setSelected([]);
    site.socketCallback(
      deposit ? "get_inventory_items" : "get_withdraw_items",
      (data: any) => {
        setLoading(false);
        if (typeof data === "string") {
          setFailed(true);
          return;
        }
        setItems(data);
      },
    );
  }, [loading]);

  return (
    <Modal onExit={onExit}>
      <div className="flex secondary flex-col items-center p-12 justify-evenly min-h-[50rem] w-[40rem]">
        <span>Select Items to {deposit ? "Deposit" : "Withdraw"}</span>
        <div className={"flex flex-row w-full"}>
          <span className={"font-bold text-base"}>
            Steam Inventory (${formatNumber(itemTotal)})
          </span>
          <div className={"flex flex-row self-end justify-self-end ml-auto"}>
            <input
              type="text"
              className={
                "bg-zinc-800 rounded-lg p-2 text-white text-base w-48 mr-4"
              }
              placeholder={"Search"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={"bg-blue-700 p-3 flex items-center justify-center"}
              onClick={() => setLoading(true)}
            >
              <FontAwesomeIcon
                icon={faSync}
                className={clsx("text-blue-500", {
                  "animate-spin": loading,
                })}
              />
            </button>
          </div>
        </div>
        <div className={"w-full h-[30rem] mt-3 relative overflow-scroll"}>
          {loading && <Loading />}
          {!ready && !loading && (
            <div
              className={
                "text-2xl h-full absolute flex items-center justify-center w-full"
              }
            >
              <span>
                {failed ? "Failed to load inventory" : "No items found"}
              </span>
            </div>
          )}
          <div className={"grid grid-cols-4 w-full gap-y-6"}>
            {!!ready &&
              uniqueItems
                .filter((item) =>
                  item.name!.toLowerCase().includes(search.toLowerCase()),
                )
                .sort((a, b) => getMarketPrice(b) - getMarketPrice(a))
                .map((item, num) => (
                  <div
                    key={num}
                    onClick={() => selectItem(item)}
                    className={`flex flex-col group bg-zinc-800 hover-scale items-center justify-center relative text-sm w-[7rem] h-[8rem]`}
                  >
                    <div
                      className={
                        "absolute w-full h-full full-radial opacity-20 z-10"
                      }
                      style={
                        {
                          "--color": `#${item.color!}`,
                        } as any
                      }
                    ></div>
                    <Image
                      alt={item.name!}
                      src={item.imageURL!}
                      width={100}
                      className={"z-20"}
                      height={100}
                    />

                    <span
                      className={clsx(
                        "text-white p-2 text-center absolute z-20 top-1/2 w-full group-hover:opacity-100 opacity-0 transition-opacity duration-300",
                      )}
                    >
                      {item.name}
                    </span>
                    <span className={"text-white absolute z-20 top-2 left-2"}>
                      ${formatNumber(getMarketPrice(item))}
                    </span>
                    <span className={"text-white absolute z-20 top-2 right-2"}>
                      x{itemAmounts[item.id!]}
                    </span>
                    {selectedAmounts[item.id!] && (
                      <span
                        className={
                          "text-white absolute w-full flex bottom-0 z-20 items-center justify-center"
                        }
                      >
                        <button
                          className={"py-2 px-4 bg-zinc-900"}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deselectItem(item);
                          }}
                        >
                          -
                        </button>
                        <span className={"bg-zinc-800 py-2 px-4"}>
                          {selectedAmounts[item.id!]}
                        </span>
                        <button
                          className={"py-2 px-4 bg-zinc-900"}
                          onClick={() => selectItem(item)}
                        >
                          +
                        </button>
                      </span>
                    )}
                  </div>
                ))}
          </div>
        </div>
        <div
          className={"bg-zinc-800 mt-5 flex flex-row w-full p-4 items-center"}
        >
          <div className={"flex flex-col items-center"}>
            <span className={"text-base"}>{selected.length} Selected</span>
            <span className={"text-base"}>${formatNumber(selectedTotal)}</span>
          </div>
          <div className={"flex flex-row self-end justify-self-end ml-auto"}>
            <button
              className={"bg-red-400 text-red-300 p-4 text-base hover-scale"}
              onClick={() => onExit()}
            >
              CANCEL
            </button>
            <button
              className={clsx(
                "bg-green-700 text-green-300 p-4 text-base ml-3 relative",
                {
                  "opacity-50 cursor-not-allowed":
                    !selected.length || loadingAction || !hasEnough,
                  "hover-scale":
                    !!selected.length && !loadingAction && hasEnough,
                },
              )}
              onClick={() => complete()}
            >
              <span
                className={clsx({
                  "opacity-0": loadingAction,
                })}
              >
                {deposit ? "DEPOSIT" : "WITHDRAW"}
              </span>
              {loadingAction && <Loading />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
