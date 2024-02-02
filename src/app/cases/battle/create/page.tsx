"use client";

import { useEffect, useMemo, useState } from "react";
import { Case } from "@/utils/cases";
import Back from "@/components/Back";
import Sword from "@/components/svg/Sword";
import clsx from "clsx";
import Add from "@/components/svg/Add";
import Skull from "@/components/svg/Skull";
import Toggle from "@/components/Toggle";
import Lock from "@/components/svg/Lock";
import CratePickModal from "@/components/battle/CratePickModal";
import { useSite } from "@/utils/SiteContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/utils/helpers/items";
import { MAX_CASE_PER_BATTLE } from "@/utils/helpers/cases";
import Loading from "@/components/Loading";
import Head from "next/head";
import Terminal from "@/components/svg/Terminal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandHoldingHeart,
  faPeopleGroup,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { getTeams } from "@/utils/helpers/games";
import Rainbow from "@/components/svg/Rainbow";

export default function CreateBattle() {
  const [mode, setMode] = useState("1v1");
  const [crates, setCrates] = useState<Case[]>([]);
  const [cursed, setCursed] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [rainbow, setRainbow] = useState(false);
  const [privateBattle, setPrivateBattle] = useState(false);
  const [allCrates, setAllCrates] = useState<Case[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [fundingPercentage, setFundingPercentage] = useState(0);
  const teams = useMemo(() => getTeams(mode), [mode]);
  const totalPrice = useMemo(() => {
    const price = crates.reduce((acc, crate) => acc + crate.price, 0);
    const funding = price * (fundingPercentage / 100);
    return (
      price +
      funding *
        (teams.map((x) => x.maxPlayers).reduce((x, acc) => x + acc, 0) - 1)
    );
  }, [crates, teams, fundingPercentage]);
  const [loading, setLoading] = useState(false);
  const site = useSite();
  const router = useRouter();

  // Remove all duplicates
  const individualCrates = useMemo(() => {
    const map = new Map<string, Case>();
    crates.forEach((crate) => {
      map.set(crate.id, crate);
    });
    return Array.from(map.values());
  }, [crates]);

  useEffect(() => {
    site.socketCallback("all_cases", setAllCrates);
  }, []);

  const createGame = () => {
    if (
      crates.length === 0 ||
      loading ||
      (site.loggedInAs?.balance ?? 0) < totalPrice
    )
      return;
    setLoading(true);
    site.socketCallback(
      "create_case_battle",
      (data: any) => {
        if (data) router.push(`/cases/battle/${data}`);
      },
      {
        crates: crates.map((x) => x.id),
        cursed,
        privateBattle,
        mode,
        terminal,
        partialFunding: fundingPercentage,
        rainbow,
      },
    );
  };

  const getNumberSelected = (caseId: string) => {
    return crates.filter((c) => c.id === caseId).length;
  };

  const addCrate = (caseId: string) => {
    const crate = allCrates.find((c) => c.id === caseId);
    if (!crate || crates.length >= MAX_CASE_PER_BATTLE) {
      return;
    }
    setCrates([...crates, crate]);
  };

  const removeCrate = (caseId: string) => {
    // Remove one
    const crate = crates.find((c) => c.id === caseId);
    if (!crate) return;
    const val = [...crates];
    val.splice(val.indexOf(crate), 1);
    setCrates(val);
  };

  return (
    <div className="flex flex-col h-full w-2/3 justify-evenly mt-10">
      <Head>
        <title key={"title"}>Create a Battle</title>
      </Head>
      {showModal && (
        <CratePickModal
          totalPrice={totalPrice}
          crates={allCrates}
          selected={crates}
          addCrate={addCrate}
          removeCrate={removeCrate}
          getNumberSelected={getNumberSelected}
          onExit={() => setShowModal(false)}
        />
      )}
      <div className="flex flex-row items-center relative justify-center w-full">
        <div className="absolute left-0">
          <Back src={"/cases/battle"} title={"battles"} />
        </div>
        <span className={"text-3xl font-bold"}>Configure Case Battle</span>
      </div>

      <div className="flex flex-col mt-12">
        <span className="font-bold text-lg">Team Configuration</span>
        <span>Select the game mode and team rules</span>
      </div>

      <div className="flex flex-row xl:flex-row w-full justify-evenly mt-8">
        <div className="secondary rounded-md flex flex-row p-4 justify-center">
          <div
            className={clsx(
              "h-full text-6xl fa-w-16 svg-inline--fa transition-colors",
              {
                "text-pink-400":
                  mode !== "2v2" && mode !== "3v3" && mode.includes("v"),
              },
            )}
          >
            <Sword />
          </div>
          <div className="flex flex-col ml-2">
            <span className="font-bold mb-2">Regular Battle</span>
            <div className="flex flex-row">
              <button
                className={clsx("p-2 text-sm rounded-md transition-colors", {
                  primary: mode === "1v1",
                  bg: mode !== "1v1",
                })}
                onClick={() => setMode("1v1")}
              >
                1v1
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "1v1v1",
                    bg: mode !== "1v1v1",
                  },
                )}
                onClick={() => setMode("1v1v1")}
              >
                3-way
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "1v1v1v1",
                    bg: mode !== "1v1v1v1",
                  },
                )}
                onClick={() => setMode("1v1v1v1")}
              >
                4-way
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "1v1v1v1v1",
                    bg: mode !== "1v1v1v1v1",
                  },
                )}
                onClick={() => setMode("1v1v1v1v1")}
              >
                5-way
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "1v1v1v1v1v1",
                    bg: mode !== "1v1v1v1v1v1",
                  },
                )}
                onClick={() => setMode("1v1v1v1v1v1")}
              >
                6-way
              </button>
            </div>
          </div>
        </div>
        <div className="secondary rounded-md flex flex-row p-4 justify-center items-center">
          <div
            className={clsx(
              "h-full text-6xl fa-w-16 mr-4 svg-inline--fa transition-colors",
              {
                "text-pink-400": mode === "2v2" || mode === "3v3",
              },
            )}
          >
            <FontAwesomeIcon icon={faPeopleGroup} />
          </div>
          <div className="flex flex-col ml-2">
            <span className="font-bold mb-2">Team Battle</span>
            <div className="flex flex-row">
              <button
                className={clsx("p-2 text-sm rounded-md transition-colors", {
                  primary: mode === "2v2",
                  bg: mode !== "2v2",
                })}
                onClick={() => setMode("2v2")}
              >
                2v2
              </button>
              <button
                className={clsx(
                  "p-2 text-sm rounded-md ml-2 transition-colors",
                  {
                    primary: mode === "3v3",
                    bg: mode !== "3v3",
                  },
                )}
                onClick={() => setMode("3v3")}
              >
                3v3
              </button>
            </div>
          </div>
        </div>
        <div className="secondary rounded-md flex flex-row p-4 justify-center">
          <div
            className={clsx(
              "h-full text-6xl fa-w-16 mr-4 svg-inline--fa transition-colors",
              {
                "text-pink-400": !mode.includes("v"),
              },
            )}
          >
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="flex flex-col ml-2">
            <span className="font-bold mb-2">Group Unbox</span>
            <div className="flex flex-row">
              <button
                className={clsx("p-2 text-sm rounded-md transition-colors", {
                  primary: mode === "2p",
                  bg: mode !== "2p",
                })}
                onClick={() => setMode("2p")}
              >
                2p
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "3p",
                    bg: mode !== "3p",
                  },
                )}
                onClick={() => setMode("3p")}
              >
                3p
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "4p",
                    bg: mode !== "4p",
                  },
                )}
                onClick={() => setMode("4p")}
              >
                4p
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "5p",
                    bg: mode !== "5p",
                  },
                )}
                onClick={() => setMode("5p")}
              >
                5p
              </button>
              <button
                className={clsx(
                  "p-2 text-sm ml-2 rounded-md transition-colors",
                  {
                    primary: mode === "6p",
                    bg: mode !== "6p",
                  },
                )}
                onClick={() => setMode("6p")}
              >
                6p
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col mt-10">
        <div className={"w-full flex-row items-center justify-center mb-5"}>
          <span className="font-bold text-xl">ADD CRATES</span>
          <div className={"flex flex-row text-center float-right"}>
            <span className={"font-bold"}>Total</span>
            <Image
              src={"/images/currency.webp"}
              alt={"Currency"}
              width={20}
              height={20}
              className={"mx-2"}
            />
            <span className={"text-md"}>{formatNumber(totalPrice)}</span>
          </div>
        </div>
        <div className="grid 3xl:grid-cols-6 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 grid-cols-1 gap-4">
          <div
            className={
              "flex flex-col p-10 secondary w-fit items-center justify-center cursor-pointer hover-scale"
            }
            onClick={() => setShowModal(true)}
          >
            <div
              className="p-3 mb-5"
              style={{
                border: "2px dashed rgba(217,235,247,.7)",
              }}
            >
              <Add />
            </div>
            <span className={"text-center"}>ADD CRATE</span>
          </div>
          {individualCrates
            .sort((a, b) => a.price - b.price)
            .map((crate, num) => (
              <div
                key={num}
                className={
                  "flex flex-col p-3 w-fit secondary hover-scale rounded-md justify-center text-center select-none"
                }
              >
                <Image
                  src={crate.image}
                  alt={crate.name}
                  width={150}
                  height={150}
                />
                <span className="font-bold mt-2">{crate.name}</span>
                <div
                  className={"flex flex-row items-center w-full justify-center"}
                >
                  <Image
                    src={"/images/currency.webp"}
                    alt={"currency"}
                    width={20}
                    height={10}
                  />
                  <span className="font-bold ml-2">
                    {formatNumber(crate.price * getNumberSelected(crate.id))}
                  </span>
                </div>
                {getNumberSelected(crate.id) > 0 && (
                  <div className={"flex flex-row items-center justify-center"}>
                    <span
                      id={"minus"}
                      className={
                        "font-bold mt-2 mr-3 bg-zinc-800 px-5 hover-scale"
                      }
                      onClick={() => removeCrate(crate.id)}
                    >
                      -
                    </span>
                    <span className="font-bold mt-2">
                      {getNumberSelected(crate.id)}
                    </span>
                    <span
                      className={
                        "font-bold mt-2 ml-3 bg-zinc-800 px-5 hover-scale"
                      }
                      onClick={() => addCrate(crate.id)}
                    >
                      +
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
        <div className="flex flex-col mt-10 items-center">
          <div className="w-full p-4 secondary flex flex-row">
            <span className={"text-5xl mr-4 text-green-300"}>
              <FontAwesomeIcon icon={faHandHoldingHeart} />
            </span>
            <div className={"flex flex-col"}>
              <span className="font-bold text-xl text-green-300">
                Partial slot funding
              </span>
              <span className="text-md">Fund each slot of the battle</span>
            </div>
            <div className={"flex-[30.33%] self-center items-center h-full"}>
              <div className="float-right flex-col items-center justify-center">
                <span>{formatNumber(fundingPercentage)}%</span>
                <input
                  type={"range"}
                  min={0}
                  max={100}
                  defaultValue={0}
                  className={"w-full bg-green-200 hover-scale"}
                  onChange={(e) =>
                    setFundingPercentage(parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {mode.includes("v") && (
          <>
            <div className="flex flex-col mt-5 items-center">
              <div className="w-full p-4 secondary flex flex-row">
                <span className={"text-5xl mr-4"}>
                  <Skull />
                </span>
                <div className={"flex flex-col"}>
                  <span className="font-bold text-xl text-red-300">
                    Cursed mode
                  </span>
                  <span className="text-md">
                    The team with the lowest amount opened wins –{" "}
                    <span className={"font-bold"}>loser wins!</span>
                  </span>
                </div>
                <div
                  className={"flex-[30.33%] self-center items-center h-full"}
                >
                  <div className="float-right">
                    <Toggle
                      setValue={(value) => setCursed(value)}
                      toggleColor={"bg-red-400"}
                    />
                  </div>
                </div>
              </div>
            </div>
            {crates.length > 1 && (
              <div className="flex flex-col mt-5 items-center">
                <div className="w-full p-4 secondary flex flex-row">
                  <span className={"text-5xl text-yellow-400 mr-4"}>
                    <Terminal />
                  </span>
                  <div className={"flex flex-col"}>
                    <span className="font-bold text-xl text-yellow-300">
                      Terminal mode
                    </span>
                    <span className="text-md">
                      Rules only apply on the last round.
                    </span>
                  </div>
                  <div
                    className={"flex-[30.33%] self-center items-center h-full"}
                  >
                    <div className="float-right">
                      <Toggle
                        setValue={(value) => setTerminal(value)}
                        toggleColor={"bg-yellow-400"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(crates.length > 1 || !mode.includes("1")) && (
              <div className="flex flex-col mt-5 items-center">
                <div className="w-full p-4 secondary flex flex-row">
                  <span className={"text-5xl mr-4"}>
                    <Rainbow />
                  </span>
                  <div className={"flex flex-col"}>
                    <span className="font-bold text-xl rainbow-text">
                      Rainbow mode
                    </span>
                    <span className="text-md">
                      The team who pulls the most unique colors wins!
                    </span>
                  </div>
                  <div
                    className={"flex-[30.33%] self-center items-center h-full"}
                  >
                    <div className="float-right">
                      <Toggle
                        setValue={(value) => setRainbow(value)}
                        toggleColor={"bg-rainbow"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex flex-col mt-5 items-center">
          <div className="w-full p-4 secondary flex flex-row">
            <span className={"text-5xl"}>
              <Lock />
            </span>
            <div className={"flex flex-col"}>
              <span className="font-bold text-xl text-blue-300">
                Private game
              </span>
              <span className="text-md">
                Hide this game from the battles page. Only joinable via link.
              </span>
            </div>
            <div className={"flex-[30.33%] self-center"}>
              <div className="float-right">
                <Toggle
                  setValue={(value) => setPrivateBattle(value)}
                  toggleColor={"bg-blue-400"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full relative mt-[6rem]">
        <button
          className={clsx(
            "p-4 rounded-md absolute right-0 font-bold text-2xl self-end",
            {
              "bg-zinc-800 cursor-not-allowed": crates.length === 0,
              "primary hover-scale":
                crates.length > 0 &&
                !loading &&
                (site.loggedInAs?.balance ?? 0) >= totalPrice,
              "cursor-not-allowed primary":
                loading || (site.loggedInAs?.balance ?? 0) < totalPrice,
            },
          )}
          onClick={createGame}
        >
          {loading && <Loading />}
          <span className={clsx({ "opacity-0": loading })}>CREATE</span>
        </button>
      </div>
    </div>
  );
}
