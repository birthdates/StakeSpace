"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCheckDouble,
  faCrown,
  faGamepad,
  faMinusCircle,
  faPlusCircle,
  faQuestionCircle,
  faRightFromBracket,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useSite } from "@/utils/SiteContext";
import { formatNumber } from "@/utils/helpers/items";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import Level from "@/components/player/Level";
import DropArrow from "@/components/DropArrow";
import DropDown, { DropDownItem } from "@/components/Dropdown";
import AccountModal, { Tab } from "@/components/player/AccountModal";
import { useEffect, useMemo, useState } from "react";
import { AppProgressBar } from "next-nprogress-bar";
import DepositModal from "@/components/deposit/DepositModal";
import SkinSelectModal from "@/components/deposit/SkinSelectModal";
import CryptoDepositModal from "@/components/deposit/CryptoDepositModal";
import { getColor, getIcon } from "@/components/Notifications";
import clsx from "clsx";

function NavbarLink({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: IconProp;
}) {
  return (
    <Link
      href={href}
      className="hover:opacity-50 transition-opacity duration-300"
    >
      <FontAwesomeIcon
        icon={icon}
        inverse
        className="text-2xl ml-4 icon-accent"
        aria-hidden
      />
      <span className="ml-2 text-gradient">{title}</span>
    </Link>
  );
}

const ACCOUNT_DROPDOWN_ITEMS: DropDownItem[] = [
  { text: "Profile", value: "profile" },
  { text: "Settings", value: "settings" },
  {
    text: "Logout",
    value: "logout",
    style: "text-red-300",
    image: <FontAwesomeIcon icon={faRightFromBracket} className={"mr-2"} />,
  },
];

const WALLET_DROPDOWN_ITEMS: DropDownItem[] = [
  {
    text: "Deposit",
    value: "deposit",
    style: "text-blue-300",
    image: <FontAwesomeIcon icon={faPlusCircle} className={"mr-2"} />,
  },
  {
    text: "Withdraw",
    value: "withdraw",
    style: "text-red-300",
    image: <FontAwesomeIcon icon={faMinusCircle} className={"mr-2"} />,
  },
];

export default function Navbar() {
  const site = useSite();
  const [accountTab, setAccountTab] = useState<Tab | undefined>();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMethod, setDepositMethod] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<DropDownItem[]>([]);

  const readNotifications = () => {
    if (!site.loggedInAs || !site.loggedInAs.notifications?.length) return;
    site.socketCallback("read_notifications", (data: any) => {
      site.setLoggedInAs!({
        ...site.loggedInAs,
        notifications: [],
      } as any);
    });
  };

  useEffect(() => {
    if (!site.loggedInAs) return;
    const notifications = site.loggedInAs!.notifications!;
    const newNotifications = [];
    newNotifications.push({
      text: "",
      value: "",
      image: (
        <div className={"flex flex-row p-3 font-normal w-full"}>
          <span className={"text-sm"}>
            {notifications.length} Notification
            {notifications.length === 1 ? "" : "s"}
          </span>
          <span
            className={clsx(
              "flex flex-row ml-auto items-center transition-opacity",
              {
                "cursor-not-allowed": !notifications.length,
                "hover:opacity-75": notifications.length,
              },
            )}
            onClick={readNotifications}
          >
            <FontAwesomeIcon icon={faCheckDouble} className={"mr-2"} />
            <span className={"text-sm"}>Mark as Read</span>
          </span>
        </div>
      ),
    });
    if (!notifications.length) {
      newNotifications.push({
        text: "",
        value: "",
        image: (
          <span className={"w-full px-3 h-full text-center items-center flex"}>
            Nothing to read...
          </span>
        ),
      });
      setNotifications(newNotifications);
      return;
    }
    for (const notification of notifications) {
      newNotifications.push({
        text: "",
        value: "",
        image: (
          <span
            className={
              "w-full overflow-ellipsis px-3 whitespace-nowrap text-lg text-center items-center flex flex-row"
            }
          >
            <FontAwesomeIcon
              icon={getIcon(notification)}
              className={`text-${getColor(notification)}-400`}
            />
            <span className={"ml-2 font-normal"}>{notification.message}</span>
          </span>
        ),
      });
    }
    setNotifications(newNotifications);
  }, [site.loggedInAs]);

  const specificDepositModal = useMemo(() => {
    if (!depositMethod) return;
    switch (depositMethod) {
      case "rust_w":
        return <SkinSelectModal onExit={() => setDepositMethod(undefined)} />;
      case "rust":
        return (
          <SkinSelectModal
            onExit={() => setDepositMethod(undefined)}
            deposit={true}
          />
        );
      default:
        return (
          <CryptoDepositModal
            defaultCurrency={depositMethod!}
            onExit={() => setDepositMethod(undefined)}
          />
        );
    }
  }, [depositMethod]);

  const onDropDownSelect = async (item: DropDownItem) => {
    switch (item.value) {
      case "profile":
        setAccountTab("account");
        break;
      case "settings":
        setAccountTab("options");
        break;
      case "logout":
        await fetch("/api/account/logout");
        window.location.reload();
        break;
    }
  };

  const onWalletDropdown = (item: DropDownItem) => {
    switch (item.value) {
      case "withdraw":
        setDepositMethod("rust_w");
        break;
      case "deposit":
        setShowDepositModal(true);
        break;
    }
  };

  return (
    <div className="fixed shadow-2xl w-full z-20 p-4 flex flex-row secondary rounded-br-xl text-2xl font-bold text-zinc-300 justify-between items-center">
      {specificDepositModal && specificDepositModal}
      {showDepositModal && (
        <DepositModal
          onExit={() => setShowDepositModal(false)}
          onSelect={(type: string) => {
            setShowDepositModal(false);
            setDepositMethod(type);
          }}
        />
      )}
      <div className="w-fit flex flex-row">
        <Link href="/" className={"hover-scale"}>
          <Image
            alt={"Barrel Bets"}
            src={"/images/logo1.png"}
            width={300}
            height={40}
          />
        </Link>
        <NavbarLink href="/" title="Games" icon={faGamepad} />
        <NavbarLink href="/top" title="Top Users" icon={faCrown} />
        <NavbarLink href="/help" title="Help" icon={faQuestionCircle} />
      </div>
      {accountTab && (
        <AccountModal
          onExit={() => setAccountTab(undefined)}
          defaultTab={accountTab}
        />
      )}
      <div className="w-fit flex flex-row">
        <div className="flex text-[1rem] flex-row items-center select-none secondary-text">
          {site.loggedInAs ? (
            <>
              <div className={"flex flex-row bg-gradient rounded-3xl"}>
                <div className="px-2 py-1 flex flex-row">
                  <Image
                    src="/images/currency.webp"
                    width={35}
                    height={25}
                    alt="Currency"
                  />
                  <span className="ml-2">
                    {formatNumber(site.loggedInAs.balance!)}
                  </span>
                </div>
                <button className="accent relative rounded-md px-3 py-1 ml-2 rounded-r-3xl flex flex-row items-center">
                  <FontAwesomeIcon
                    icon={faWallet}
                    inverse
                    className="text-2xl mr-4"
                    aria-hidden
                  />
                  <span>WALLET</span>
                  <DropDown
                    className={"w-full"}
                    items={WALLET_DROPDOWN_ITEMS}
                    onSelect={onWalletDropdown}
                    active={-1}
                  />
                </button>
              </div>
              <div
                className={
                  "rounded-full bg-gradient relative ml-3 p-2 w-10 h-10 text-center align-middle cursor-pointer"
                }
              >
                <FontAwesomeIcon icon={faBell} inverse className={"text-2xl"} />

                <DropDown
                  items={notifications}
                  clickOnly={true}
                  noScale={true}
                  className={
                    "w-[25rem] max-h-[60rem] overflow-scroll mb-80 right-1/2"
                  }
                  onSelect={() => {}}
                  active={-1}
                />
              </div>
              <div className={"ml-3 flex flex-row items-center relative"}>
                <Image
                  src={site.loggedInAs!.profilePicture!}
                  width={40}
                  height={40}
                  alt={site.loggedInAs!.displayName ?? "Guest"}
                />
                <span className={"ml-3"}>
                  <Level level={site.loggedInAs!.level!} />
                </span>
                <span className={"ml-2"}>{site.loggedInAs!.displayName!}</span>
                <span className={"ml-2"}>
                  <DropArrow />
                </span>
                <DropDown
                  items={ACCOUNT_DROPDOWN_ITEMS}
                  onSelect={onDropDownSelect}
                  active={-1}
                />
              </div>
            </>
          ) : (
            <Link
              href="/api/login"
              className="py-1 px-4 hover:opacity-80 transition-opacity"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      <div className={"w-full h-[6px] bottom-0 z-[105] absolute"}>
        <AppProgressBar
          options={{ showSpinner: false }}
          height="4px"
          color={"#C42F6A"}
        />
      </div>
    </div>
  );
}
