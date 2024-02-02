export default function CryptoIcon({
  currency,
  size,
}: {
  currency: string;
  size?: number;
}) {
  switch (currency) {
    case "BTC":
      return (
        <svg
          data-v-61a1a0b0=""
          width={36 * (size ?? 1)}
          height={36 * (size ?? 1)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="cryptoicon--BTC"
        >
          <g fill="none" fillRule="evenodd">
            <circle cx="16" cy="16" r="16" fill="#F7931A"></circle>
            <path
              fill="#FFF"
              fillRule="nonzero"
              d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
            ></path>
          </g>
        </svg>
      );
    case "ETH":
      return (
        <svg
          data-v-61a1a0b0=""
          width={36 * (size ?? 1)}
          height={36 * (size ?? 1)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="cryptoicon--ETH"
        >
          <g fill="none" fillRule="evenodd">
            <circle cx="16" cy="16" r="16" fill="#627EEA"></circle>
            <g fill="#FFF" fillRule="nonzero">
              <path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z"></path>
              <path d="M16.498 4L9 16.22l7.498-3.35z"></path>
              <path
                fillOpacity=".602"
                d="M16.498 21.968v6.027L24 17.616z"
              ></path>
              <path d="M16.498 27.995v-6.028L9 17.616z"></path>
              <path
                fillOpacity=".2"
                d="M16.498 20.573l7.497-4.353-7.497-3.348z"
              ></path>
              <path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z"></path>
            </g>
          </g>
        </svg>
      );
    case "BNB":
      return (
        <svg
          data-v-61a1a0b0=""
          width={36 * (size ?? 1)}
          height={36 * (size ?? 1)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="cryptoicon--BNB"
        >
          <g fill="none">
            <circle cx="16" cy="16" r="16" fill="#F3BA2F"></circle>
            <path
              fill="#FFF"
              d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z"
            ></path>
          </g>
        </svg>
      );
    case "USDT":
      return (
        <svg
          data-v-0a3f8a5e=""
          width={36 * (size ?? 1)}
          height={36 * (size ?? 1)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="cryptoicon--usdt"
        >
          <g fill="none" fillRule="evenodd">
            <circle cx="16" cy="16" r="16" fill="#26A17B"></circle>
            <path
              fill="#FFF"
              d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
            ></path>
          </g>
        </svg>
      );
    case "LTC":
      return (
        <svg
          data-v-0a3f8a5e=""
          width={36 * (size ?? 1)}
          height={36 * (size ?? 1)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="cryptoicon--ltc"
        >
          <g fill="none" fillRule="evenodd">
            <circle cx="16" cy="16" r="16" fill="#BFBBBB"></circle>
            <path
              fill="#FFF"
              d="M10.427 19.214L9 19.768l.688-2.759 1.444-.58L13.213 8h5.129l-1.519 6.196 1.41-.571-.68 2.75-1.427.571-.848 3.483H23L22.127 24H9.252z"
            ></path>
          </g>
        </svg>
      );
    default:
      return <></>;
  }
}
