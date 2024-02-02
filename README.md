**This app is unfinsihed.**

It is a [Rust](https://store.steampowered.com/agecheck/app/252490/) gambling site. Similar to [BanditCamp](https://bandit.camp) or [RustClash](https://rustclash.com)

(sorry for bad code it was unfinished due to personal issues)

### Features
* Crate openings
* Create battles (1v1, 2v2, 3v3)
* Group unboxes
* Admin menu to create creates
* Somewhat working chat system
* Steam login
* Withdraw and depositing system (crypto using CoinPayments, rust skins)
* No home page
* Live battle page
* Mines (somewhat finished)

### Stack
* Redis
* NextJS
* NodeJS (18.17.0+)
* socket.io
* Tailwind CSS
* clsxx
* FontAwesome (react library)
* Chalk
* EosJOS
* Steam-TOTP
* Steam-Trafeoffer-Manager
* Steam-User
* websocket (ws)
* sharp

## Steam Bot
* Remove steam guard if active.
* Download this (program)[https://github.com/Jessecar96/SteamDesktopAuthenticator]
* Run it and find your identitySecret and sharedSecret in ***/maFiles/***.maFile

* Then create a file `api/bot_logins.json`

It should be formatted like this:
```json
[
  {
    "username": "x",
    "password": "y",
    "sharedSecret": "z",
    "identitySecret": "a"
  },
  {
    "username": "x",
    "password": "y",
    "sharedSecret": "z",
    "identitySecret": "a"
  }
]
```
This is an array so multiple accounts will be used.

The account with the lowest inventory value will always get deposited into first. If multiple accounts are necesarry to complete a withdrawl, this is possible as well.

This will allow trading from bots.


## How to build
0. `npm install`

### .env.local variables

 1. `NEXT_PUBLIC_WEBSOCKET_HOST` (host of socket server)

 2. `MONGODB_URI`

 3. `REDIS_PASSWORD`

 4. `NEXT_PUBLIC_HOST` (host of next server, i.e https://google.com)

 5. `STEAM_API_KEY` (web api key)[https://steamcommunity.com/dev/apikey]

 6. `STEAM2_API_KEY` (used for (steam market api)[https://api.steamapis.com])

 7. `COINPAYMENTS_PUBLIC_KEY`

 8. `COINPAYMENTS_PRIVATE_KEY`

 9. `COIN_MERCHANT_ID`

 10. `COIN_IPN_SECRET` (IPN required)

 11. `CRYPTO_COMPARE_KEY` (used here)[https://min-api.cryptocompare.com]

 12. `REDIS_HOST`

## Afterwards

* `npm run build`

* `npm run start`

### Starting socket **(REQUIRED)**

* `cd api`
* `npm run start`