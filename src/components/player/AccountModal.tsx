import { useSite } from "@/utils/SiteContext";
import { RefObject, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { formatId } from "@/utils/helpers/games";
import clsx from "clsx";
import Level, { LEVEL_ICONS } from "@/components/player/Level";
import {
  getBiggestLevelCase,
  getXPForLevel,
  LEVELS,
  toHHMMSS,
} from "@/utils/helpers/accounts";
import { formatNumber, isBigWin } from "@/utils/helpers/items";
import ProgressBar from "@/components/ProgressBar";
import { Tooltip } from "react-tooltip";
import { Case, CaseItem } from "@/utils/cases";
import CaseInfoModal from "@/components/cases/CaseInfoModal";
import CrateOpen from "@/components/cases/CrateOpen";
import Link from "next/link";
import Loading from "@/components/Loading";
import { Simulate } from "react-dom/test-utils";
import load = Simulate.load;

export type Tab =
  | "account"
  | "affiliates"
  | "options"
  | "bet_history"
  | "transactions"
  | "trades";
const ALL_TABS: Tab[] = [
  "account",
  "affiliates",
  "options",
  "bet_history",
  "transactions",
  "trades",
];

function AccountTab() {
  const site = useSite();
  const [roundID, setRoundID] = useState<string | undefined>();
  const [openLoading, setOpenLoading] = useState(false);
  const levelXP = site.loggedInAs!.xp!;
  const nextLevelXP = getXPForLevel(site.loggedInAs!.level! + 1);
  const xpRemaining = nextLevelXP - levelXP;
  const percentageToNext = (levelXP / nextLevelXP) * 100;
  const hasNoCooldown = site.loggedInAs?.levelCaseCooldown! <= Date.now();
  const hasCases = Object.values(site.loggedInAs!.levelCases!).some(
    (x) => x > 0,
  );
  const [previewCrate, setPreviewCrate] = useState<Case | undefined>();
  const biggestLevelCase = getBiggestLevelCase(site.loggedInAs!);
  const tierCase = LEVELS.findIndex((x) => x === biggestLevelCase) + 1;
  const [wonItem, setWonItem] = useState<CaseItem | undefined>();
  const [crate, setCrate] = useState<Case | undefined>();
  const animationStart = useRef<number>(0);

  const previewLevelCase = (minLevel: number) => {
    site.socketCallback(
      "get_level_case",
      (crate: Case) => {
        setPreviewCrate(crate);
      },
      { level: minLevel },
    );
  };

  const openCase = () => {
    if (!hasCases || !hasNoCooldown || openLoading) return;
    setOpenLoading(true);
    site.socketCallback("open_level_case", (data: any) => {
      setRoundID(data.roundId);
      animationStart.current = Date.now();
      const cooldown = data.cooldown;
      site.setLoggedInAs!({
        ...site.loggedInAs!,
        levelCaseCooldown: cooldown,
        levelCases: data.levelCases,
      });
      setCrate(data.crate);
      setWonItem(data.item);
      setOpenLoading(false);
    });
  };

  const onCrateFinished = () => {
    const sound = isBigWin([wonItem!], crate!.price).length
      ? "win_cash"
      : "land";
    site.playAudio(`${sound}.webm`);
  };

  return (
    <div className={"flex flex-col w-full h-full"}>
      {previewCrate && (
        <CaseInfoModal
          crate={previewCrate}
          onExit={() => setPreviewCrate(undefined)}
        />
      )}
      <div className={"flex flex-row w-full items-center"}>
        <div className={"p-4 bg-zinc-800 text-4xl"}>
          <Level level={site.loggedInAs!.level!} />
        </div>
        <div className={"flex flex-col ml-4"}>
          <span className={"text-xl flex flex-row font-bold items-center"}>
            <span>Level {site.loggedInAs!.level!}</span>
            <span className={"text-gradient ml-2 text-sm"}>
              ({formatNumber(levelXP, 0)} XP)
            </span>
          </span>
          <span
            className={"text-xl flex flex-row font-bold items-center"}
            data-tooltip-variant={"info"}
            data-tooltip-place={"top"}
            data-tooltip-id="level_progress"
            data-tooltip-content={
              formatNumber(xpRemaining, 0) + " XP Remaining"
            }
          >
            <ProgressBar progress={percentageToNext} className={"w-48"} />
            <Tooltip id="level_progress" className={"text-sm"} />
            <span className={"text-gradient ml-2 text-sm"}>
              ({formatNumber(nextLevelXP, 0)} XP)
            </span>
          </span>
        </div>
        <div
          className={
            "flex-[33.33%] justify-end w-full justify-items-end uppercase"
          }
        >
          <span
            className={clsx("float-right p-3 relative text-base rounded-md", {
              "bg-zinc-800 cursor-not-allowed": !hasCases || !hasNoCooldown,
              "bg-gradient hover-scale": hasCases && hasNoCooldown,
            })}
            onClick={openCase}
          >
            {openLoading && <Loading />}
            <span
              className={clsx({
                "opacity-0": openLoading,
              })}
            >
              {!hasNoCooldown
                ? toHHMMSS(
                    (
                      (site.loggedInAs?.levelCaseCooldown! - Date.now()) /
                      1000
                    ).toString(),
                  )
                : hasCases
                ? `Open Tier ${tierCase} Case`
                : "No Cases"}
            </span>
          </span>
        </div>
      </div>
      {crate && (
        <div className={"w-full h-32 mt-4"}>
          <CrateOpen
            host={true}
            onFinished={onCrateFinished}
            crate={crate}
            crateItems={crate.items}
            animationStart={animationStart}
            wonItem={wonItem}
            roundID={roundID!}
          />
        </div>
      )}
      <div className={"flex flex-col mt-5"}>
        <span
          className={
            "text-xl text-gradient uppercase primary-text-shadow font-bold"
          }
        >
          Level Cases
        </span>
        <span className={"text-sm"}>
          Click on a tier to see the contents of that case. Level cases are
          opened from highest to lowest tier.{" "}
        </span>
        <div className={"grid grid-cols-10 gap-3 mt-3"}>
          {Object.values(LEVEL_ICONS).map((icon, num) => (
            <div
              className={
                "flex flex-col items-center justify-center bg-zinc-800 p-3 hover-scale"
              }
              key={num}
              onClick={() => previewLevelCase(icon.minLevel)}
            >
              <Level level={icon.minLevel} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountOption({
  description,
  title,
  placeholder,
  def,
  inputType,
  update,
  loading,
  field,
}: {
  description: JSX.Element;
  title: string;
  placeholder: string;
  def?: string;
  inputType?: string;
  update: Function;
  field: string;
  loading: string | undefined;
}) {
  return (
    <div className={"bg-zinc-800 flex flex-col mt-5 p-3"}>
      <span className={"text-lg font-bold"}>{title}</span>
      {description}
      <div className={"flex flex-row w-full items-center mt-2"}>
        <input
          id={field}
          type={inputType ?? "text"}
          placeholder={placeholder}
          className={"p-2 bg-zinc-700 text-white w-full"}
          defaultValue={def}
        />
        <button
          onClick={() =>
            update(field, (document.getElementById(field) as any)?.value ?? "")
          }
          className={
            "bg-green-700 text-green-400 relative px-3 py-2 ml-4 hover-scale"
          }
        >
          <span
            className={clsx({
              "opacity-0 cursor-not-allowed": loading === field,
              "hover-scale": loading !== field,
            })}
          >
            SAVE
          </span>
          {loading === field && <Loading />}
        </button>
      </div>
    </div>
  );
}

function OptionsTab() {
  const site = useSite();
  const [loading, setLoading] = useState<string | undefined>();

  const updateSound = () => {};

  const update = (field: string, value: string) => {
    setLoading(field);

    console.log(`update_${field}`, value);
    site.socketCallback(
      `update_${field}`,
      (data: any) => {
        if (data !== "FAIL") {
          site.setLoggedInAs!({ ...site.loggedInAs, [field]: value } as any);
          site.playAudio("notif_success.webm");
        }

        setLoading((prev) => {
          if (prev === field) return undefined;
          return prev;
        });
      },
      { value },
    );
  };

  const generateSeed = () => {
    const element = document.getElementById("clientSeed") as any;
    element.value =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  };

  return (
    <div className={"flex flex-col font-normal text-base"}>
      <span className={"text-3xl font-bold"}>Options</span>
      <AccountOption
        description={
          <span>
            Your trade URL is required to send you items. You can find it{" "}
            <Link
              href={
                "https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
              }
              className={"text-gradient"}
            >
              here
            </Link>
            .
          </span>
        }
        title={"Steam Trade URL"}
        placeholder={"Trade URL"}
        def={site.loggedInAs?.tradeURL}
        update={update}
        field={"tradeURL"}
        loading={loading}
      />
      <AccountOption
        description={
          <span>
            Receive free promo codes, important account updates and other
            rewards.
          </span>
        }
        inputType={"email"}
        title={"Email Address"}
        placeholder={"Email"}
        def={site.loggedInAs?.email}
        update={update}
        field={"email"}
        loading={loading}
      />
      <AccountOption
        description={
          <span>
            Use this to change the outcome of rolls generated with your server
            seed.
            <br />
            <span
              className={"text-gradient hover-scale"}
              onClick={() => generateSeed()}
            >
              Click here
            </span>{" "}
            to generate a random seed.
          </span>
        }
        title={"Client Seed"}
        placeholder={"Seed"}
        def={site.loggedInAs?.clientSeed}
        update={update}
        field={"clientSeed"}
        loading={loading}
      />
    </div>
  );
}
function getTab(tab: Tab): JSX.Element {
  switch (tab) {
    case "account":
      return <AccountTab />;
    case "options":
      return <OptionsTab />;
  }
  return <AccountTab />;
}

export default function AccountModal({
  defaultTab,
  onExit,
}: {
  defaultTab?: Tab;
  onExit: Function;
}) {
  const site = useSite();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab ?? "account");

  return (
    <Modal onExit={onExit}>
      <div className={"flex flex-row z-[100] secondary rounded-md w-[60rem]"}>
        <div
          className={"flex flex-col items-center justify-center bg-zinc-800"}
        >
          {ALL_TABS.map((tab, num) => (
            <span
              className={clsx("text-xl p-3 w-full hover-scale", {
                "bg-gradient": activeTab === tab,
              })}
              key={num}
              onClick={() => setActiveTab(tab)}
            >
              {formatId(tab)}
            </span>
          ))}
        </div>
        <div className={"p-10 w-full"}>{getTab(activeTab)}</div>
      </div>
    </Modal>
  );
}
