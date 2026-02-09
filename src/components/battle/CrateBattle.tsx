"use client";

import { CrateBattle, Team } from "@/utils/games";
import Back from "@/components/Back";
import Share from "@/components/svg/Share";
import VolumeButton from "@/components/VolumeButton";
import Image from "next/image";
import { formatNumber, getItemColor, isBigWin } from "@/utils/helpers/items";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
  faRedo,
  faScaleBalanced,
  faSignIn,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import CrateOpen from "@/components/cases/CrateOpen";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Case, CaseItem } from "@/utils/cases";
import { CaseItemPreview } from "@/components/cases/CasePreview";
import clsx from "clsx";
import { useSite } from "@/utils/SiteContext";
import { formatId, getTeamColor, Winnings } from "@/utils/helpers/games";
import { AnimatePresence, motion } from "framer-motion";
import Robot from "@/components/svg/Robot";
import Counter from "@/components/Counter";
import Skull from "@/components/svg/Skull";
import ReCreateModal from "@/components/battle/ReCreateModal";
import ConfettiExplosion from "react-confetti-explosion";
import CaseInfoModal from "@/components/cases/CaseInfoModal";
import Terminal from "@/components/svg/Terminal";
import Rainbow from "@/components/svg/Rainbow";
import Level from "@/components/player/Level";
import { AccountData } from "@/utils/account";
import { toHHMMSS } from "@/utils/helpers/accounts";

type Confetti = {
  winners?: number[][];
  amounts?: number[];
  colors?: string[][];
  width: number;
};

const getConfettiAmount = (percentage: number) => {
  return 60 + 75 * (1 - percentage / 10000);
};

const randomColorOffsets = (mainColorRGB: string): string[] => {
  const rgb = mainColorRGB.split(",").map((x) => parseInt(x));
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  const output: string[] = [];
  const offset = 50;
  for (let i = 0; i < 10; i++) {
    // Random number between offset & -offset
    const rOffset = Math.floor(Math.random() * (offset * 2)) - offset;
    const gOffset = Math.floor(Math.random() * (offset * 2)) - offset;
    const bOffset = Math.floor(Math.random() * (offset * 2)) - offset;
    output.push(
      `#${Math.min(r + rOffset, 255).toString(16)}${Math.min(
        g + gOffset,
        255,
      ).toString(16)}${Math.min(b + bOffset, 255).toString(16)}`,
    );
  }
  return output;
};

function WinningsCounter({
  battle,
  winnings,
  teamIndex,
}: {
  battle: CrateBattle;
  winnings?: Winnings;
  teamIndex: number;
}) {
  return (
    <>
      <div className={"flex flex-row justify-center text-3xl"}>
        {battle.cursed && (
          <span>
            <Skull />
          </span>
        )}
        {battle.terminal && (
          <span className={clsx("text-yellow-400", { "ml-3": battle.cursed })}>
            <Terminal />
          </span>
        )}
        {battle.rainbow && (
          <span className={clsx({ "ml-3": battle.terminal || battle.cursed })}>
            <Rainbow />
          </span>
        )}
      </div>
      <Image
        alt={"currency"}
        src={"/images/currency.webp"}
        height={60}
        width={60}
      />
      <Counter
        from={0}
        to={winnings?.wonBalances[teamIndex] ?? 0}
        className={"text-pink-400 text-2xl font-bold"}
      />
    </>
  );
}

const smooth_scroll_to = function (
  element: HTMLDivElement,
  target: number,
  duration: number,
) {
  target = Math.round(target);
  duration = Math.round(duration);
  if (duration < 0) {
    return Promise.reject("bad duration");
  }
  if (duration === 0) {
    element.scrollTop = target;
    return Promise.resolve();
  }

  const start_time = Date.now();
  const end_time = start_time + duration;

  const start_top = element.scrollTop;
  const distance = target - start_top;

  // based on http://en.wikipedia.org/wiki/Smoothstep
  const smooth_step = function (start: number, end: number, point: number) {
    if (point <= start) {
      return 0;
    }
    if (point >= end) {
      return 1;
    }
    const x = (point - start) / (end - start); // interpolation
    return x * x * (3 - 2 * x);
  };

  return new Promise(function (resolve: any, reject) {
    // This is to keep track of where the element's scrollTop is
    // supposed to be, based on what we're doing
    let previous_top = element.scrollTop;

    // This is like a think function from a game loop
    const scroll_frame = function () {
      if (element.scrollTop != previous_top) {
        reject("interrupted");
        return;
      }

      // set the scrollTop for this frame
      const now = Date.now();
      const point = smooth_step(start_time, end_time, now);
      const frameTop = Math.round(start_top + distance * point);
      element.scrollTop = frameTop;

      // check if we're done!
      if (now >= end_time) {
        resolve();
        return;
      }

      // If we were supposed to scroll but didn't, then we
      // probably hit the limit, so consider it done; not
      // interrupted.
      if (
        element.scrollTop === previous_top &&
        element.scrollTop !== frameTop
      ) {
        resolve();
        return;
      }
      previous_top = element.scrollTop;

      // schedule next frame for execution
      setTimeout(scroll_frame, 0);
    };

    // boostrap the animation process
    setTimeout(scroll_frame, 0);
  });
};

export default function CrateBattle({ battle }: { battle: CrateBattle }) {
  const mapTeams = (teams: Team[]): Promise<Team[]> => {
    const allPlayerIDS = teams
      .map((x) => x.players)
      .flat()
      .map((y) => y.id);
    return new Promise((res) => {
      site.socketCallback(
        "get_player_infos",
        (data: AccountData[]) => {
          // Add this data to players
          for (const team of teams) {
            team.players = team.players.map((x) => {
              return data.find((y) => y.id === x.id)!;
            });
          }
          res(teams);
        },
        { ids: allPlayerIDS },
      );
    });
  };

  const [currentRound, setCurrentRound] = useState(battle.round);
  const [status, setStatus] = useState<string>(battle.status);
  const [eosBlock, setEOSBlock] = useState(battle.eosBlock);
  const timerRef = useRef<number | undefined>();
  const [wonItems, setWonItems] = useState<CaseItem[]>(battle.wonItems);
  const [teams, setTeams] = useState<Team[]>(battle.teams);
  const [animFinished, setAnimFinished] = useState(
    Math.max(battle.round - (battle.status !== "ended" ? 1 : 0), -1),
  );
  const [start, setStart] = useState<number>(battle.expires);
  const [winnings, setWinnings] = useState<Winnings | undefined>(
    battle.winnings,
  );
  const [doAnimation, setDoAnimation] = useState<boolean>(false);
  const [showRedo, setShowRedo] = useState<boolean>(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [expiry, setExpiry] = useState<number>(battle.expires);
  const [confetti, setConfetti] = useState<Confetti>();
  const animationStart = useRef<number>(battle.roundStart);
  const [showInfoModel, setShowInfoModal] = useState<Case>();
  const site = useSite();
  const isCreator = useMemo(
    () => battle.creatorId === site.loggedInAs?.id,
    [battle.creatorId, site.loggedInAs?.id],
  );
  const dropsRef = useRef<HTMLDivElement>(null);

  const onCrateOpenFinish = async () => {
    setAnimFinished(animFinished + 1);
    const startIndex = currentRound * teams[0].maxPlayers * teams.length;
    const endIndex = startIndex + teams.length * teams[0].maxPlayers;
    const splicedWonItems = wonItems.slice(startIndex, endIndex);
    const r_pot = Math.floor(Math.random() * 3) + 1;
    const wins = isBigWin(splicedWonItems, battle.crates![currentRound].price);
    const sound = wins.length ? `jackpot${r_pot}` : "land";
    await site.playAudio(`${sound}.webm`);
    if (wins.length > 0) {
      const mainContainerWidth =
        (mainContainerRef.current!.clientWidth /
          (teams[0].maxPlayers * teams.length)) *
        2;
      setConfetti({
        width: mainContainerWidth,
        winners: wins.map((x) => [
          Math.floor(x / teams[0].maxPlayers),
          x % teams[0].maxPlayers,
        ]),
        colors: wins.map((x) =>
          randomColorOffsets(
            getItemColor(
              wonItems[startIndex + x].price! /
                battle.crates![currentRound].price,
              wonItems[startIndex + x].price!,
            ),
          ),
        ),
        amounts: wins.map((x) =>
          getConfettiAmount(
            battle.crates![currentRound].items.find(
              (y) => y.id === wonItems[startIndex + x].id,
            )!.weight,
          ),
        ),
      });

      setTimeout(() => setConfetti(undefined), 3000);
    }
  };
  const playCountUp = (ticks: number) => {
    const sound = (ticks % 3) + 1;
    site.playAudio(`tally${sound}.webm`);
  };

  useEffect(() => {
    // Scroll dropsRef based off number of won items
    const totalPlayers = teams
      .map((x) => x.maxPlayers)
      .reduce((x, acc) => x + acc, 0);
    const itemsPerPlayer = Math.floor((wonItems.length - 1) / totalPlayers) / 2;
    const heightOfFirstChild =
      document.querySelector(".battle-drop")!.clientHeight;
    smooth_scroll_to(
      dropsRef.current!,
      heightOfFirstChild * itemsPerPlayer,
      300,
    );
  }, [teams, animFinished, wonItems]);

  useEffect(() => {
    site.socket?.on(`eos_${battle.id}`, (data: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setEOSBlock(data);
      setStatus("eos");
    });

    site.socket?.on(`player_joined_${battle.id}`, (data: any) => {
      const { teams } = data;
      if (!teams) {
        return;
      }
      mapTeams(teams).then(setTeams);
    });
    site.socket?.on(`new_round_${battle.id}`, (data: any) => {
      const { round, wonItems, start, expires } = data;
      if (
        round === undefined ||
        wonItems === undefined ||
        start === undefined ||
        expires === undefined
      )
        return;
      if (timerRef.current) clearInterval(timerRef.current);
      animationStart.current = Date.now();
      setExpiry(expires);
      setAnimFinished(round - 1);
      setStatus("in_progress");
      setCurrentRound(round);
      setWonItems(wonItems);
    });

    site.socket?.once(
      `ended_${battle.id}`,
      ({
        winnings,
        wonItems,
      }: {
        winnings: Winnings;
        wonItems: CaseItem[];
      }) => {
        setWinnings(winnings);
        setWonItems(wonItems);
        setStatus("ended");
        setAnimFinished(battle.roundIDs.length + 1);
        setDoAnimation(true);
        let counter = 0;
        const interval = setInterval(() => playCountUp(counter++), 100);
        setTimeout(() => {
          setDoAnimation(false);
          setWinnings((prev) => {
            const totalWon = prev!.winPerTeam / teams[0].maxPlayers;
            if (totalWon > battle.cost) {
              const profitPercentage = (totalWon - battle.cost) / battle.cost;
              const winIndex =
                profitPercentage <= 1.5 ? 2 : profitPercentage <= 2 ? 3 : 2;
              site.playAudio(`win_final${winIndex}.webm`).then(() => {
                setConfetti({
                  amounts: [200 + getConfettiAmount(profitPercentage)],
                  colors: [randomColorOffsets("215, 114, 158")],
                  width: mainContainerRef.current!.clientWidth,
                });
              });
            }
            return prev;
          });
        }, 6200);
        setTimeout(() => {
          clearInterval(interval);
          setTimeout(() => site.playAudio("show_winner.webm"), 200);
        }, 5000);
      },
    );

    site.socket?.once(`starting_${battle.id}`, (data: any) => {
      const { start, teams } = data;
      if (!start || !teams) return;
      setStatus("starting");
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setStart((prev) => prev! - 0.05);
      }, 500) as any;
      mapTeams(teams).then(setTeams);
      setStart(start);
    });
    mapTeams(battle.teams).then(setTeams);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      site.socket?.off(`new_round_${battle.id}`);
      site.socket?.off(`ended_${battle.id}`);
      site.socket?.off(`player_joined_${battle.id}`);
      site.socket?.off(`starting_${battle.id}`);
      site.socket?.off(`eos_${battle.id}`);
    };
  }, []);

  const copyBattleLink = () => {
    site.copyToClipboard(window.location.href);
  };

  const joinBattle = (teamID: number) => {
    if (status !== "waiting") return;
    site.socketMessage("join_game", {
      game: "crate_battle",
      id: battle.id,
      team: teamID,
    });
  };

  const callBot = (teamID: number, teams: Team[], index: number) => {
    if (!isCreator || status !== "waiting" || teams[teamID].players[index])
      return;
    site.socketMessage("call_bots", {
      game: "crate_battle",
      id: battle.id,
      team: teamID,
    });
  };

  return (
    <div
      className={clsx(
        "flex flex-col items-center h-full select-none relative",
        [
          teams.map((x) => x.maxPlayers).reduce((x, acc) => x + acc, 0) > 3
            ? "min-w-[100%]"
            : "min-w-[80%]",
        ],
      )}
    >
      {showRedo && (
        <ReCreateModal battle={battle} onExit={() => setShowRedo(false)} />
      )}
      {showInfoModel && (
        <CaseInfoModal
          crate={showInfoModel}
          onExit={() => setShowInfoModal(undefined)}
        />
      )}
      <div className={"flex flex-row justify-between w-full items-center"}>
        <Back src={"/cases/battle"} title={"battles"} />
        <div className={"flex flex-col justify-center items-center"}>
          <span className={"font-bold text-xl"}>{battle.mode} Battle</span>
          {battle.cursed && (
            <span
              className={"text-red-300 inline-flex text-sm items-center cursed"}
            >
              <span className={"mr-4"}>
                <Skull />
              </span>
              CURSED MODE
            </span>
          )}
          {battle.rainbow && (
            <span
              className={
                "inline-flex text-sm items-center rainbow-text rainbow rainbow-shadow"
              }
            >
              <span className={"mr-4"}>
                <Rainbow />
              </span>
              RAINBOW MODE
            </span>
          )}
          {battle.terminal && (
            <span
              className={
                "text-yellow-300 inline-flex text-sm items-center terminal"
              }
            >
              <span className={"mr-4"}>
                <Terminal />
              </span>
              TERMINAL MODE
            </span>
          )}
        </div>
        <div className={"flex flex-row"}>
          <div
            className={
              "secondary rounded-md hover-scale p-4 flex flex-row items-center"
            }
            onClick={copyBattleLink}
          >
            <Share />
            <span>SHARE</span>
          </div>
          <div className={"ml-3"}>
            <VolumeButton />
          </div>
        </div>
      </div>

      <div className={"w-full items-center mt-10 flex"}>
        <div className={"inline-flex flex-row flex-[33.33%]"}>
          <span className={"font-bold text-md"}>TOTAL</span>
          <Image
            src={"/images/currency.webp"}
            alt={"Currency"}
            width={20}
            height={20}
            className={"mx-2"}
          />
          <span className={"font-bold text-md"}>
            {formatNumber(battle.cost)}
          </span>
        </div>
        <div
          className={
            "inline-flex self-center relative flex-row flex-[40%] flex-grow-0 z-30"
          }
        >
          <div className={"absolute mt-1 bg-zinc-800 p-3 w-full"}>
            <div className={"flex flex-row"}>
              {currentRound >= 0 && (
                <div
                  className={
                    "flex flex-col flex-[25%] font-bold text-sm flex-nowrap overflow-ellipsis"
                  }
                >
                  <span
                    className={
                      "font-bold text-md over overflow-ellipsis whitespace-nowrap"
                    }
                  >
                    {battle.crates![currentRound].name}
                  </span>
                  <div className={"flex flex-row"}>
                    <Image
                      src={"/images/currency.webp"}
                      alt={"Currency"}
                      width={20}
                      height={20}
                    />
                    <span>
                      {formatNumber(battle.crates![currentRound].price)}
                    </span>
                  </div>
                </div>
              )}
              <div className={"flex-[55%] ml-1 overflow-hidden"}>
                <div
                  className={"flex flex-row transition-transform"}
                  style={{
                    // Translate X based off of current round to make the current round always first
                    transform: `translateX(${
                      -Math.max(currentRound, 0) * 56.0386
                    }px)`,
                  }}
                >
                  {battle.crates!.map((crate, index) => (
                    <Image
                      key={index}
                      className={"hover-scale mx-[8px]"}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setShowInfoModal(crate);
                      }}
                      onClick={() => setShowInfoModal(crate)}
                      src={crate.image}
                      alt={crate.name}
                      width={40}
                      height={40}
                    />
                  ))}
                </div>
              </div>
              <div
                className={
                  "flex flex-[20%] text-sm w-full h-full items-center justify-center whitespace-nowrap"
                }
              >
                <div className={"float-right mt-2 ml-4"}>
                  {status === "in_progress" ? (
                    <span className={"font-bold"}>
                      {currentRound + 1} / {battle.roundIDs.length}
                    </span>
                  ) : (
                    <span className={"uppercase"}>{formatId(status)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={"flex-[33.33%]"}>
          <Link
            href={"/fairness"}
            className={"float-right flex flex-row items-center hover-scale"}
          >
            <FontAwesomeIcon
              icon={faFileContract}
              className={"text-blue-400"}
            />
            <span className={"font-bold text-md ml-3"}>Fairness</span>
          </Link>
        </div>
      </div>

      {/* Crate Opening */}
      <div
        className={
          "flex flex-row justify-between w-full h-[20rem] mt-2 secondary relative"
        }
        ref={mainContainerRef}
      >
        {battle.mode.includes("v") &&
          status !== "ended" &&
          status !== "starting" &&
          status !== "eos" && (
            <div
              className={
                "left-0 flex flex-row w-full absolute h-full justify-evenly items-center"
              }
            >
              {Array(Math.max(teams.length - 1, 0))
                .fill(0)
                .map((_, x) => (
                  <div
                    key={x}
                    className={
                      "bg-zinc-900 p-3 rotate-2 text-3xl rounded-md h-fit bottom-5 left-[5rem] z-40"
                    }
                  >
                    <span>VS</span>
                  </div>
                ))}
            </div>
          )}
        {status === "starting" || status === "eos" ? (
          <div
            className={
              "flex flex-col text-3xl h-full w-full items-center justify-center text-center relative"
            }
          >
            {status === "starting" ? (
              <>
                <span>Starting</span>
                <span className={"text-white"}>
                  {toHHMMSS(
                    String(Math.round(Math.max(start - Date.now(), 0) / 1000)),
                  )
                    .split(":")
                    .slice(1)
                    .join(":")}
                </span>
              </>
            ) : (
              <div
                className={"flex flex-row items-center justify-center h-full"}
              >
                <FontAwesomeIcon
                  icon={faScaleBalanced}
                  className={"mr-3 text-6xl text-pink-400"}
                />
                <div className={"flex flex-col w-full justify-center h-full"}>
                  <span className={"text-xl"}>Waiting for EOS Block</span>
                  <Link href={`https://bloks.io/block/${eosBlock}`}>
                    <span className={"text-gradient text-2xl"}>
                      #{eosBlock}
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : doAnimation ? (
          teams.map((team, teamIndex) => (
            <AnimatePresence key={teamIndex}>
              <motion.div
                animate={{ transform: "scale(100%)" }}
                initial={{ transform: "scale(0)" }}
                exit={{ transform: "scale(0)" }}
                key={teamIndex}
                className={
                  "flex flex-row h-full items-center justify-center w-full text-center overflow-hidden"
                }
              >
                {winnings?.winningTeams.includes(teamIndex) ? (
                  <motion.div
                    className={clsx(
                      "text-2xl font-bold items-center text-center justify-center flex flex-col",
                      {
                        "text-pink-400": !battle.cursed,
                        "text-red-300": battle.cursed,
                      },
                    )}
                    transition={{ delay: 5.2 }}
                    animate={{
                      transform: "scale(140%)",
                      translate: "translateY(15%)",
                    }}
                    initial={{
                      transform: "scale(100%)",
                      translate: "translateY(0%)",
                    }}
                  >
                    <WinningsCounter
                      battle={battle}
                      teamIndex={teamIndex}
                      winnings={winnings}
                    />
                  </motion.div>
                ) : (
                  <div
                    className={
                      "items-center justify-center text-center flex flex-col"
                    }
                  >
                    <WinningsCounter
                      battle={battle}
                      teamIndex={teamIndex}
                      winnings={winnings}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ))
        ) : status === "ended" ? (
          <motion.div
            initial={{
              scale: "0",
            }}
            animate={{
              scale: "100%",
            }}
            className={
              "flex flex-col items-center justify-center w-full h-full"
            }
          >
            {confetti && confetti.colors && (
              <div
                className={
                  "absolute h-full w-full flex items-center justify-center z-[-1]"
                }
              >
                <ConfettiExplosion
                  width={confetti.width}
                  force={0.5}
                  duration={5000}
                  zIndex={50}
                  colors={confetti.colors[0]}
                  particleCount={confetti.amounts![0] ?? 100}
                />
              </div>
            )}
            <div className={"flex flex-row text-3xl items-center"}>
              <Image
                src={"/images/currency.webp"}
                width={80}
                height={80}
                alt={"Currency"}
              />
              <span className={"font-bold ml-3"}>
                {formatNumber(
                  winnings?.wonBalances.reduce((x, acc) => x + acc) ?? 0,
                )}
              </span>
            </div>
            {site.loggedInAs && (
              <button
                className={"rounded-2xl accent p-3 hover-scale mt-3"}
                onClick={() => setShowRedo(true)}
              >
                <FontAwesomeIcon icon={faRedo} />
                <span className={"ml-3"}>Re-create battle</span>
              </button>
            )}
          </motion.div>
        ) : (
          teams.map((team, teamIndex) => (
            <div
              key={teamIndex}
              className={"flex flex-row h-full items-center w-full"}
            >
              {Array(team.maxPlayers)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className={"h-full w-full relative overflow-hidden"}
                  >
                    {confetti &&
                      confetti.winners &&
                      confetti.winners.find(
                        (x) => x[0] === teamIndex && x[1] === index,
                      ) && (
                        <div
                          className={
                            "absolute h-full w-full flex items-center justify-center z-[-1]"
                          }
                        >
                          <ConfettiExplosion
                            width={confetti?.width}
                            force={0.5}
                            duration={3000}
                            zIndex={50}
                            onComplete={() => setConfetti(undefined)}
                            colors={
                              confetti.colors
                                ? confetti.colors[
                                    confetti.winners.findIndex(
                                      (x) =>
                                        x[0] === teamIndex && x[1] === index,
                                    )
                                  ]!
                                : [""]
                            }
                            particleCount={
                              confetti.amounts![
                                confetti.winners.findIndex(
                                  (x) => x[0] === teamIndex && x[1] === index,
                                )
                              ] ?? 100
                            }
                          />
                        </div>
                      )}
                    {currentRound >= 0 && team.players[index] ? (
                      <CrateOpen
                        key={index}
                        multi={true}
                        end={expiry}
                        host={teamIndex === 0 && index === 0}
                        onFinished={onCrateOpenFinish}
                        crate={battle.crates![currentRound]}
                        crateItems={battle.crates![currentRound].items}
                        animationStart={animationStart}
                        wonItem={
                          wonItems[
                            teamIndex * team.maxPlayers +
                              currentRound * team.maxPlayers * teams.length +
                              index
                          ]
                        }
                        roundID={
                          battle.roundIDs[currentRound] + team.players[index].id
                        }
                      />
                    ) : (
                      <div
                        key={index}
                        className={
                          "w-full h-full flex items-center justify-center"
                        }
                      >
                        WAITING
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))
        )}
      </div>

      {/* Players */}
      <div className={"flex flex-row w-full justify-around"}>
        {teams.map((team, teamIndex) => (
          <div
            key={teamIndex}
            className={clsx(
              "flex flex-row h-full items-center justify-between",
              {
                "w-full": teams.length == 1,
              },
            )}
          >
            {Array(team.maxPlayers)
              .fill(0)
              .map((_, index) => (
                <div
                  className={clsx(
                    "flex flex-col items-center justify-center relative mr-2",
                    {
                      "w-[13vw]":
                        (teams[0].maxPlayers > 3 && teams[0].maxPlayers <= 5) ||
                        (teams.length > 4 && teams.length < 6),
                      "w-[11vw]": teams.length >= 6 || teams[0].maxPlayers >= 6,
                      "w-[12vw]": teams[0].maxPlayers >= 3,
                      "w-[18vw]": teams[0].maxPlayers < 3 && teams.length <= 4,
                    },
                  )}
                  key={index}
                >
                  <div
                    className={clsx(
                      "flex flex-row w-full mx-8 items-center text-center bg-zinc-800 z-20 absolute mb-5",
                      {
                        "hover-scale":
                          !team.players[index] &&
                          (site.loggedInAs?.balance! >= battle.joinCost ||
                            isCreator),
                        "animate-bounce":
                          status === "ended" &&
                          !doAnimation &&
                          winnings?.winningTeams.includes(teamIndex),
                        "cursor-not-allowed":
                          (!isCreator && !site.loggedInAs) ||
                          site.loggedInAs?.balance! < battle.joinCost,
                      },
                    )}
                    onClick={() =>
                      isCreator
                        ? callBot(team.id, teams, index)
                        : joinBattle(team.id)
                    }
                  >
                    {!doAnimation &&
                      status === "ended" &&
                      winnings?.winningTeams.includes(teamIndex) && (
                        <div
                          className={
                            "absolute bottom-[4rem] text-center w-full flex flex-row items-center justify-center"
                          }
                        >
                          <Image
                            src={"/images/currency.webp"}
                            width={40}
                            height={40}
                            alt={"Currency"}
                          />
                          <span className={"font-bold text-2xl ml-3"}>
                            {formatNumber(
                              winnings?.winPerTeam / team.maxPlayers,
                            )}
                          </span>
                        </div>
                      )}
                    <div
                      className={
                        "text-3xl w-[4rem] h-[3.20rem] relative rotate-0"
                      }
                      style={
                        {
                          "--color": team.players[index]
                            ? `rgb(${
                                teams.length > 1
                                  ? getTeamColor(team.id)
                                  : getTeamColor(index)
                              })`
                            : "rgba(0,0,0, 0)",
                        } as any
                      }
                    >
                      <div
                        className={"h-full items-center flex justify-center"}
                      >
                        {team.players[index] ? (
                          <Image
                            className={"bg-color z-20 rounded-md"}
                            src={team.players[index].profilePicture!}
                            alt={team.players[index].displayName!}
                            width={50}
                            height={50}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faSignIn} />
                        )}
                      </div>
                    </div>
                    <div
                      className={
                        "flex flex-row items-center p-4 max-w-full text-lg truncate"
                      }
                    >
                      {team.players[index]?.bot && (
                        <div className={"mr-2"}>
                          <Robot />
                        </div>
                      )}
                      <div className={"flex flex-row w-full"}>
                        {team.players[index]?.displayName ? (
                          <>
                            {!team.players[index].bot && (
                              <Level
                                level={team.players[index].level!}
                                className={"mr-2 text-lg"}
                              />
                            )}
                            <span>{team.players[index]!.displayName}</span>
                          </>
                        ) : (
                          <span>
                            {isCreator
                              ? "Call bot"
                              : site.loggedInAs?.balance! < battle.joinCost
                              ? "Waiting for player..."
                              : "Join game"}
                          </span>
                        )}
                        {!team.players[index] &&
                          !isCreator &&
                          !teams.some((y) =>
                            y.players.some((x) => x.id === site.loggedInAs?.id),
                          ) && (
                            <div
                              className={
                                "flex justify-end flex-[33.33%] float-right flex-row items-center"
                              }
                            >
                              <Image
                                src={"/images/currency.webp"}
                                width={20}
                                height={10}
                                alt={"Currency"}
                              />
                              <span className={"ml-2"}>
                                {formatNumber(battle.joinCost)}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Drops */}
      <div
        className={
          "flex flex-row mt-10 justify-evenly w-full h-[55vh] overflow-y-scroll"
        }
        ref={dropsRef}
      >
        {teams.map((team, teamIndex) => (
          <div
            key={teamIndex}
            className={"flex flex-row h-full justify-around mr-3"}
          >
            {Array(team.maxPlayers)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={clsx("grid grid-cols-2 gap-3 h-fit mr-3")}
                >
                  {Array(battle.roundIDs.length)
                    .fill(0)
                    .map((_, roundIndex) => (
                      <div
                        className={clsx(
                          "secondary relative flex items-center justify-center mr-3 battle-drop",
                          {
                            "w-[6vw] h-[6vw]":
                              (teams[0].maxPlayers >= 3 &&
                                teams[0].maxPlayers <= 5) ||
                              (teams.length > 4 && teams.length < 6),
                            "w-[5.5vw] h-[5.5vw]":
                              teams.length >= 6 || teams[0].maxPlayers >= 6,
                            "w-[8vw] h-[8vw]":
                              teams[0].maxPlayers < 3 && teams.length <= 4,
                          },
                        )}
                        key={roundIndex}
                      >
                        <div
                          className={
                            "absolute top-[0.75rem] left-[0.75rem] z-30"
                          }
                        >
                          <span className={"text-gray-500 text-xl"}>#</span>
                          <span
                            className={
                              "text-2xl absolute top-[0.4rem] left-[0.4rem]"
                            }
                          >
                            {roundIndex + 1}
                          </span>
                        </div>

                        {wonItems[
                          teamIndex * team.maxPlayers +
                            roundIndex * team.maxPlayers * teams.length +
                            index
                        ] && animFinished >= roundIndex ? (
                          <motion.div
                            initial={{
                              scale: "0",
                            }}
                            animate={{
                              scale: "100%",
                            }}
                            className={"absolute top-0 left-0 w-full h-full"}
                          >
                            <CaseItemPreview
                              item={
                                wonItems[
                                  teamIndex * team.maxPlayers +
                                    roundIndex *
                                      team.maxPlayers *
                                      teams.length +
                                    index
                                ]
                              }
                              crate={battle.crates![roundIndex]}
                            />
                          </motion.div>
                        ) : (
                          <div
                            className={
                              "w-full h-full flex items-center justify-center text-3xl"
                            }
                          >
                            N/A
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
