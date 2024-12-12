# clank.fun

easily browse and trade clanker memecoins on Base

## architecture

* GitHub action hits app API endpoint every few minutes
  * scrape clanker API for latest tokens into postgres
* Hot / Top queries hit two dune queries
  * results are cached in Redis to save $$$
  * dune data enriched with scraped clanker data
  * ethers used to look up latest market cap for each coin
  * Neynar used to pull cast + engagement for each coin
  * all data rendered with React (fetched via server actions)
* New query hits the clanker API directly for fresh data
* trading implemented using 0x protocol 

## set up for development:

* copy envs in `.env.example` to `.env`
* set up the required services (I run everything on a coolify instance)
