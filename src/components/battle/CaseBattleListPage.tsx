"use client";

import { useEffect, useState } from "react";
import DropDown, { DropDownItem } from "@/components/Dropdown";
import DropArrow from "@/components/DropArrow";
import Link from "next/link";
import { CrateBattle } from "@/utils/games";
import { useSite } from "@/utils/SiteContext";
import Image from "next/image";
import { formatNumber } from "@/utils/helpers/items";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignIn } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { Case } from "@/utils/cases";
import CaseInfoModal from "@/components/cases/CaseInfoModal";

const AMOUNT_ITEMS: DropDownItem[] = [
  { text: "5 battles", value: 5 },
  { text: "10 battles", value: 10 },
  { text: "25 battles", value: 25 },
  { text: "50 battles", value: 50 },
];

export default function CaseBattleListPage() {
  const [showAmount, setShowAmount] = useState(50);
  const [battles, setBattles] = useState<CrateBattle[]>([]);
  const [crateModal, setCrateModal] = useState<Case>();
  const site = useSite();
  const router = useRouter();

  const setModal = (crate: Case) => {
    site.socketCallback(
      "map_items",
      (items) => {
        const newCrate = { ...crate };
        newCrate.items = items;
        setCrateModal(newCrate);
      },
      { items: crate.items },
    );
  };

  useEffect(() => {
    site.socketCallback("get_games", setBattles, { game: "crate_battle" });

    site.socket?.on("crate_battle_created", (battle: CrateBattle) => {
      setBattles((prev) => [battle, ...prev]);
    });

    site.socket?.on("crate_battle_updated", (battle: CrateBattle) => {
      setBattles((prev) => {
        const index = prev.findIndex((x) => x.id === battle.id);
        if (index === -1) return prev;
        prev[index] = battle;
        return [...prev];
      });
    });

    return () => {
      site.socket?.off("crate_battle_created");
    };
  }, []);

  const joinGame = (battle: CrateBattle, team: number) => {
    site.socketCallback(
      "join_game",
      () => {
        router.push(`/cases/battle/${battle.id}`);
      },
      { game: "crate_battle", id: battle.id, team },
    );
  };

  return (
    <>
      <div className={"flex flex-col w-3/4"}>
        {crateModal && (
          <CaseInfoModal
            crate={crateModal}
            onExit={() => setCrateModal(undefined)}
          />
        )}
        <div className="flex flex-row w-full justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">Case Battles</span>
            <span className="text-lg">
              Battle against or with other players
            </span>
          </div>
          <div className="flex flex-row">
            <span className="p-2 flex items-center justify-center relative flex-row select-none cursor-pointer secondary-hover">
              <span className="mr-2">Show {showAmount}</span>
              <DropArrow />
              <DropDown
                className="text-sm"
                items={AMOUNT_ITEMS}
                onSelect={(amount) => setShowAmount(amount.value)}
                active={AMOUNT_ITEMS.findIndex((item) =>
                  item.text.startsWith(showAmount.toString()),
                )}
              />
            </span>
            <Link
              href={"/cases/battle/create"}
              className="bg-gradient hover-scale ml-5 flex flex-row h-full flex-1 items-center justify-center text-white font-bold py-2 px-4 rounded"
            >
              <span>CREATE BATTLE</span>
            </Link>
          </div>
        </div>
        <div className={"flex flex-col select-none"}>
          {battles
            // Sort by ended last
            .sort((a, b) => {
              if (a.status === "ended" && b.status !== "ended") return 1;
              if (a.status !== "ended" && b.status === "ended") return -1;
              return b.cost - a.cost;
            })
            .slice(0, showAmount)
            .map((battle, num) => (
              <Link
                prefetch={false}
                href={`/cases/battle/${battle.id}`}
                key={num}
                className={"hover-scale"}
              >
                <div className={"flex flex-row p-4 secondary mt-5"}>
                  <div className={"flex flex-col"}>
                    <div className={"flex flex-row items-center flex-[20%]"}>
                      <span className={"text-lg flex flex-row font-bold"}>
                        <Image
                          src={"/images/currency.webp"}
                          alt={"Currency"}
                          width={20}
                          height={10}
                        />
                        <span className={"ml-2"}>
                          {formatNumber(battle.cost)}
                        </span>
                      </span>
                      <span className={"ml-3"}>
                        {battle.cursed && (
                          <span
                            className={
                              "text-red-400 mr-2 font-bold uppercase cursed"
                            }
                          >
                            Cursed
                          </span>
                        )}
                        {battle.rainbow && (
                          <span
                            className={
                              "mr-2 font-bold uppercase rainbow rainbow-shadow rainbow-text"
                            }
                          >
                            Rainbow
                          </span>
                        )}
                        {battle.terminal && (
                          <span
                            className={
                              "text-yellow-400 mr-2 font-bold uppercase terminal"
                            }
                          >
                            Terminal
                          </span>
                        )}
                        <span>{battle.mode} Battle</span>
                      </span>
                    </div>
                    <div className={"flex flew-row mt-4 flex-[50%]"}>
                      {battle.teams.map((team, index) => (
                        <div key={index} className={"flex flex-row"}>
                          {Array(team.maxPlayers)
                            .fill(0)
                            .map((_, playerIndex) => (
                              <div
                                key={playerIndex}
                                className={"flex flex-row items-center"}
                              >
                                {team.players[playerIndex] ? (
                                  <Image
                                    className={"hover-scale ml-2"}
                                    src={
                                      team.players[playerIndex].profilePicture!
                                    }
                                    alt={team.players[playerIndex].displayName!}
                                    width={40}
                                    height={40}
                                  />
                                ) : (
                                  <div
                                    className={
                                      "flex flex-row items-center justify-center bg-zinc-900 w-12 h-12 hover-scale ml-2"
                                    }
                                    onClick={(event) => {
                                      event.preventDefault();
                                      joinGame(battle, index);
                                    }}
                                  >
                                    <span
                                      className={"text-xl text-white font-bold"}
                                    >
                                      <FontAwesomeIcon icon={faSignIn} />
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          {battle.mode.includes("v") &&
                            index !== battle.teams.length - 1 && (
                              <span
                                className={"mx-2 font-bold text-xl self-center"}
                              >
                                VS
                              </span>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={
                      "flex flex-row items-center ml-12 flex-[30%] overflow-hidden max-w-[40%] grow-0 shrink-0"
                    }
                  >
                    {battle.crates!.map((x) => {
                      return (
                        <div
                          key={x.id}
                          className={
                            "flex flex-col hover-scale overflow-hidden items-center justify-center relative ml-3"
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            setModal(x);
                          }}
                        >
                          <Image
                            src={x.image}
                            alt={x.name}
                            width={60}
                            height={60}
                          />
                          <div
                            className={
                              "absolute bottom-0 right-[-0.5rem] opacity-80 bg-zinc-700 rounded-[50%] px-2"
                            }
                          >
                            <span className={"text-white font-bold"}>
                              x{battle.caseIDs.filter((y) => y === x.id).length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className={
                      "flex-row text-xl font-bold flex-[5%] items-center justify-end hidden 3xl:flex"
                    }
                  >
                    {battle.status === "waiting" ||
                      (battle.status === "ended" && (
                        <div
                          className={
                            "flex flex-col items-center justify-center"
                          }
                        >
                          <span>{battle.roundIDs.length} Rounds</span>
                          {battle.status === "ended" && (
                            <div className={"flex flex-row"}>
                              <Image
                                src={"/images/currency.webp"}
                                width={20}
                                height={10}
                                alt={"Currency"}
                              />
                              <span className={"font-bold ml-2"}>
                                {formatNumber(
                                  battle.winnings!.winPerTeam /
                                    battle.teams[0].maxPlayers,
                                )}{" "}
                                won
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    {battle.status === "waiting" && <span>Waiting</span>}
                    {battle.status === "starting" && <span>Starting</span>}
                    {battle.status === "in_progress" && (
                      <span>
                        {battle.round + 1} / {battle.roundIDs.length}
                      </span>
                    )}
                    <div
                      className={
                        "uppercase bg-zinc-800 p-3 font-bold ml-3 hover-scale"
                      }
                    >
                      Watch game
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </>
  );
}
