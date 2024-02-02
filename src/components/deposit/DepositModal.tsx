import Modal from "@/components/Modal";
import CryptoIcon from "@/components/CryptoIcon";
import {
  CRYPTO_DEPOSIT_BONUS,
  FULL_CURRENCY_NAMES,
  SUPPORTED_CURRENCIES,
} from "@/utils/helpers/crypto";
import { formatNumber } from "@/utils/helpers/items";

export default function DepositModal({
  onExit,
  onSelect,
}: {
  onExit: Function;
  onSelect: Function;
}) {
  return (
    <Modal onExit={onExit}>
      <div className="flex secondary flex-col items-center p-12 justify-evenly h-[50rem] w-[40rem]">
        <span>Select a deposit method</span>
        <div
          className={"flex flex-col w-60 h-80 relative hover-scale"}
          onClick={() => onSelect("rust")}
          style={
            {
              "--color": "#CC636A",
            } as any
          }
        >
          <div
            className={"absolute w-full h-full shadow-icon"}
            style={{
              backgroundImage: "url('/images/rust-card.jpg')",
              backgroundSize: "cover",
            }}
          ></div>
          <span
            className={
              "z-[10000] text-4xl w-full text-center absolute bottom-5 font-bold uppercase text-[#CC636A] shadow-color"
            }
          >
            Rust
          </span>
        </div>
        <span className={"text-3xl mt-3"}>Cryptocurrency</span>
        <span
          className={"text-green-400 shadow-color"}
          style={
            {
              "--color": "#32a852",
            } as any
          }
        >
          +{formatNumber((CRYPTO_DEPOSIT_BONUS - 1) * 100, 0)}%
        </span>
        <div className={"grid grid-cols-4 gap-4 w-full"}>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <div
              className={
                "p-4 bg-zinc-800 hover-scale rounded-2xl flex flex-col items-center justify-center"
              }
              onClick={() => onSelect(currency)}
              key={currency}
            >
              <CryptoIcon currency={currency} />
              <span className={"font-bold text-base mt-2 whitespace-nowrap"}>
                {FULL_CURRENCY_NAMES[currency]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
