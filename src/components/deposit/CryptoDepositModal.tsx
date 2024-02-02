import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import CryptoIcon from "@/components/CryptoIcon";
import {
  CRYPTO_DEPOSIT_BONUS,
  FULL_CURRENCY_NAMES,
  SUPPORTED_CURRENCIES,
} from "@/utils/helpers/crypto";
import DropDown, { DropDownItem } from "@/components/Dropdown";
import DropArrow from "@/components/DropArrow";
import Loading from "@/components/Loading";
import { useSite } from "@/utils/SiteContext";
import { formatNumber } from "@/utils/helpers/items";
import Image from "next/image";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

export default function CryptoDepositModal({
  defaultCurrency,
  onExit,
}: {
  defaultCurrency: string;
  onExit: Function;
}) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [loading, setLoading] = useState(true);
  const [conversions, setConversions] = useState<any>({});
  const [address, setAddress] = useState<string | undefined>();
  const [showQR, setShowQR] = useState<boolean>(true);
  const [qrLoading, setQRLoading] = useState<boolean>(true); // [sic
  const [qrCode, setQRCode] = useState<string | undefined>();
  const currencyRef = useRef<HTMLInputElement>(null);
  const balanceRef = useRef<HTMLInputElement>(null);
  const dropDownItems = useMemo(() => {
    return SUPPORTED_CURRENCIES.map((currency) => ({
      text: "",
      value: currency,
      image: (
        <div
          className={"flex flex-row items-center w-full"}
          style={{ zIndex: 10000 }}
        >
          <CryptoIcon currency={currency} />
          <span className={"ml-2 flex-col"}>
            <span className={"font-bold mr-2"}>
              {FULL_CURRENCY_NAMES[currency]}
            </span>
            <span className={"text-gradient"}>{currency}</span>
          </span>
          <div className={"justify-self-end ml-auto"}>
            <span
              className={"text-green-400 shadow-color"}
              style={{ "--color": "#32a852" } as any}
            >
              ${formatNumber(conversions[currency])}
            </span>
          </div>
        </div>
      ),
    }));
  }, [conversions]);
  const activeDropDownItem = useMemo(() => {
    return dropDownItems.findIndex((item) => item.value === currency);
  }, [currency, dropDownItems]);
  const site = useSite();

  const convertTo = (amount: number) => {
    return amount * conversions[currency];
  };

  const convertFrom = (amount: number) => {
    return formatNumber(amount / conversions[currency], 7);
  };

  const changeRef = (targetRef: RefObject<HTMLInputElement>, value: any) => {
    if (targetRef.current) {
      targetRef.current.value = value;
    }
  };

  useEffect(() => {
    setLoading(true);
    site.socketCallback(
      "get_deposit_address",
      ({ address, qrCode }: any) => {
        setAddress(address);
        setQRLoading(true);
        setQRCode(qrCode);
        setLoading(false);
      },
      { currency },
    );
  }, [currency]);

  useEffect(() => {
    site.socketCallback("get_conversions", (data) => {
      setConversions(data);
    });
  }, []);

  return (
    <Modal onExit={onExit}>
      <div className="flex flex-col secondary p-4 w-[30rem] h-[40rem] text-base z-[-1]">
        {loading && <Loading />}
        <div
          className={
            "bg-zinc-800 relative hover:opacity-90 transition-opacity cursor-pointer"
          }
          onMouseEnter={() => setShowQR(false)}
          onMouseLeave={() => setShowQR(true)}
        >
          <div className={"p-3 flex flex-row items-center w-full"}>
            <CryptoIcon currency={currency} />
            <div className={"flex flex-col ml-2 justify-center"}>
              <span className={"flex flex-row"}>
                <span className={"font-bold"}>
                  {FULL_CURRENCY_NAMES[currency]}
                </span>
                <span className={"text-gradient ml-2"}>{currency}</span>
              </span>
              <span
                className={"text-green-400 shadow-color"}
                style={
                  {
                    "--color": "#32a852",
                  } as any
                }
              >
                ${formatNumber(conversions[currency])}
              </span>
            </div>
            <div
              className={"flex flex-row items-center justify-self-end ml-auto"}
            >
              <DropArrow />
            </div>
          </div>
          <DropDown
            items={dropDownItems}
            bgColor={"bg-zinc-800"}
            onSelect={(item) => {
              setCurrency(item.value);
              setShowQR(true);
            }}
            active={activeDropDownItem}
          />
        </div>
        <div className={"flex flex-row mt-5"}>
          <div
            className={clsx("w-2/3 relative", {
              "z-[-1]": !showQR,
            })}
          >
            {qrCode && (
              <Image
                src={qrCode}
                alt={"QR Code"}
                key={qrCode}
                fill
                onLoadingComplete={() => setQRLoading(false)}
                style={{ objectFit: "contain" }}
              />
            )}
            {qrLoading && showQR && <Loading />}
          </div>

          <div className={"w-full flex-col p-4 bg-zinc-800 ml-4"}>
            <div>
              <span className={"font-bold mb-3"}>
                {FULL_CURRENCY_NAMES[currency]}
              </span>
              <span className={"text-gradient ml-2"}>{currency}</span>
            </div>
            <span className={"text-sm text-blue-300 font-normal inline"}>
              <span className={"inline"}>
                Scan the QR code or copy the address and send your desired
                amount.
              </span>

              <span className={"inline-flex flex-row font-bold items-center"}>
                <span className={"mr-2 ml-1"}>Minimum </span>
                <CryptoIcon currency={currency} size={0.5} />
                <span className={"ml-2"}>{convertFrom(2)}</span>
              </span>
            </span>
            <span className={"block mt-3 font-normal text-xs"}>
              Always double-check the address and the amount before sending. We
              cannot recover funds sent to the wrong address.
            </span>
          </div>
        </div>
        <div className={"w-full flex-col p-4 bg-zinc-800 mt-5"}>
          <div className={"w-full flex-row flex"}>
            <span>Currency Conversion</span>
            <span
              className={"ml-auto text-green-400 shadow-color"}
              style={
                {
                  "--color": "#32a852",
                } as any
              }
            >
              +{formatNumber((CRYPTO_DEPOSIT_BONUS - 1) * 100, 0)}%
            </span>
          </div>
          <span className={"text-[0.75rem] font-normal"}>
            The final amount is calculated once your deposit confirms on the
            network.
          </span>
          <div className={"flex flex-row justify-evenly mt-5"}>
            <div
              className={
                "flex flex-row items-center w-[42.5%] secondary p-2 rounded-md"
              }
            >
              <CryptoIcon currency={currency} size={0.5} />
              <input
                type={"number"}
                ref={currencyRef}
                className={"bg-transparent w-full ml-2"}
                placeholder={"0.00"}
                onChange={(e) =>
                  changeRef(balanceRef, convertTo(parseFloat(e.target.value)))
                }
              />
            </div>
            <div className={"secondary p-2 text-4xl rounded-md"}>≅</div>
            <div
              className={
                "flex flex-row items-center secondary p-2 w-[42.5%] rounded-md"
              }
            >
              <Image
                src={"/images/currency.webp"}
                alt={"Currency"}
                height={15}
                width={25}
              />
              <input
                type={"number"}
                ref={balanceRef}
                className={"bg-transparent w-full ml-2"}
                placeholder={"0.00"}
                onChange={(e) =>
                  changeRef(
                    currencyRef,
                    convertFrom(parseFloat(e.target.value)),
                  )
                }
              />
            </div>
          </div>
        </div>
        <div className={"w-full flex-col p-4 bg-zinc-800 mt-5"}>
          <span className={"text-lg"}>Wallet Address</span>
          <div
            className={
              "flex flex-row items-center mt-3 p-3 secondary rounded-md"
            }
          >
            <input
              type={"text"}
              className={"w-full bg-transparent"}
              placeholder={"0.00"}
              value={address}
              onClick={(e) => {
                e.currentTarget.select();
              }}
              readOnly
            />
            <FontAwesomeIcon
              icon={faCopy}
              onClick={() => site.copyToClipboard(address!)}
              className={"ml-auto text-lg hover-scale text-green-500"}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
