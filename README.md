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

## contribute

you will need a neynar API key + access to their replicator DB. 
you can mock the DB easily for local development.
see `src/app/server.ts` for more info.
