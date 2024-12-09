/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { type ClankerWithData, serverFetchBalance, serverFetchCA, serverFetchClankers, serverFetchHotClankers, serverFetchNativeCoin, serverFetchTopClankers, serverSearchClankers } from "./server";
import { type EmbedCast, type EmbedUrl, type CastWithInteractions } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { motion } from 'framer-motion';
import { ArrowRight, CandlestickChart, ChartAreaIcon, ChartBar, ChartCandlestick, ChartNoAxesColumnIncreasing, Clipboard, Clock, DollarSign, LucideHeart, LucideMessageCircle, LucideRotateCcw, MessageCircle, Reply, Rocket, Search, Share, Users, Wallet, Zap } from "lucide-react";
import { WithTooltip } from "./components";
import { useToast } from "~/hooks/use-toast";
import { ConnectKitButton } from "connectkit";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { io } from 'socket.io-client';
import moment from "moment"

type NavPage = "latest" | "hot" | "top" | "search"

function shareUrl() {
  const url = new URL("https://warpcast.com/~/compose")
  url.searchParams.append("text", "Loving this slick new clanker app! 🔥")
  url.searchParams.append("embeds[]", "https://clank.fun")

  return url.toString()
}

function cleanText(text: string) {
  const cleaned = text.split(" ").map((word) => {
    if (word.length > 15) {
      return word.slice(0, 15) + "...";
    }
    return word;
  }).join(" ");

  if (cleaned.length > 200) {
    return cleaned.slice(0, 200) + "...";
  }
  return cleaned;
}

function cleanTicker(text: string) {
  if (text.length > 13) {
    return text.slice(0, 13) + "...";
  }
  return text
}


export function App() {
  const [view, setView] = useState<NavPage>("hot");
  const [searchQuery, setSearchQuery] = useState<string>("")

  let feed
  if (view === "search") {
    feed = <SearchResults query={searchQuery}/>
  } else if (view === "latest") {
    feed = <LatestFeed/>
  } else if (view === "top") {
    feed = <TopFeed/>
  } else {
    feed = <HotFeed/>
  }

  return (
    <div className="w-full flex justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-900 p-2 lg:p-6">
      <div className="w-full">
        <Nav 
          refreshing={false} 
          view={view} 
          setView={setView} 
          setSearchQuery={setSearchQuery}
        />
        <p className="py-2">
        </p>
        <div className="md:hidden">
          <ClankfunShill/>
        </div>
        <div className="fixed bottom-10 right-10 hidden md:block z-[30]">
          <ClankfunShill/>
        </div>
        {feed}
      </div>
    </div>
  );
}

function ClankfunShill() {
  const [data, setData] = useState<ClankerWithData | null>(null)
  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)

  useEffect(() => {
    async function fetchClankfun() {
      const data = await serverFetchNativeCoin()
      setData(data)
    }
    void fetchClankfun()
  }, [])

  return (
    <div className="w-full">
      {data && (
        <motion.div
          onClick={() => setDetailClanker(data)}
          style={{
            // skewX: "-3deg",
            // skewY: "4deg",
          }}
          whileHover={{
            scale: 1.1,
            rotate: 3,
          }}
          className="cursor-pointer w-full flex gap-2 bg-purple-800 px-2 py-2 rounded-md mb-2 items-center border-2 border-purple-600"
        >
          <img src={data.img_url!} alt="Clankfun" className="w-8 h-8 rounded" />
          <div className="flex-grow">
            <span className="font-bold">$CLANKFUN</span>
          </div>
          <div className="mr-2">
            ${formatPrice(data.marketCap)}
          </div>
          <a href="https://dexscreener.com/base/0x1d008f50fb828ef9debbbeae1b71fffe929bf317" target="_blank" rel="noopener noreferrer">
            <WithTooltip text="View on DexScreener">
              <Button size="icon" className="bg-purple-500 hover:bg-purple-400 text-white">
                <ChartAreaIcon size={34} />
              </Button>
            </WithTooltip>
          </a>
          <a href="https://t.me/clankfunn" target="_blank" rel="noopener noreferrer">
            <WithTooltip text="Join the community">
              <Button size="icon" className="bg-purple-500 hover:bg-purple-400 text-white">
                <MessageCircle size={34} />
              </Button>
            </WithTooltip>
          </a>
          {detailClanker && <BuyModal
            clanker={detailClanker}
            onOpenChange={() => setDetailClanker(null)}
            apeAmount={0}
            onAped={() => { void 0 }}
          />}
        </motion.div>
      )}
    </div>
  )
}

function SearchResults({ query }: { query: string }) {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [searching, setSearching] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  useEffect(() => {
    const fetchClankers = async () => {
      setClankers([])
      setSearching(true);
      const data = await serverSearchClankers(query);
      setClankers(data);
      setSearching(false);
    };

    void fetchClankers();
  }, [query]);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  return (
    <div className="w-full">
      {searching && (
        <Loader text={`Searching for ${query}`} />
      )}
      {!searching && clankers.length === 0 && (
        <div className="w-full h-20 grid place-items-center">
          No results found for &quot;{query}&quot;
        </div>
      )}
      <motion.div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clankers.map((item, i) => (
          <ClankItem 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            onApe={(eth) => onApe(item, eth)}
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button className="w-full mb-4" disabled={searching}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
    </div>
  );
}

export function LatestFeed() {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const init = await serverFetchClankers();
      setClankers(init.data);
      setPage(init.lastPage);
      setRefreshing(false);
    };

    void fetchClankers();
  }, []);

  async function fetchMore() {
    setRefreshing(true)
    const newPage = page + 1;
    const res = await serverFetchClankers(newPage);
    setClankers(prevClankers => [...prevClankers, ...res.data]);
    setPage(newPage);
    setRefreshing(false)
  }

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  return (
    <div className="w-full">
      {clankers.length === 0 && (
        <Loader text="Loading new clankers" />
      )}
      <motion.div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clankers.map((item, i) => (
          <ClankItem 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            onApe={(eth) => onApe(item, eth)}
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <Button className="w-full" onClick={fetchMore} disabled={refreshing}>
          Load more
        </Button>
        <a href={shareUrl()} className="w-full">
          <Button variant="secondary" className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
    </div>
  );
}

export function TopFeed() {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const data = await serverFetchTopClankers();
      setClankers(data);
      setRefreshing(false);
    };

    void fetchClankers();
  }, []);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  return (
    <div className="w-full">
      {clankers.length === 0 && (
        <Loader text="Loading top clankers"  />
      )}
      <motion.div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clankers.map((item, i) => (
          <ClankItem 
            key={i} 
            c={item} 
            onSelect={() => setDetailClanker(item)} 
            onApe={(eth) => onApe(item, eth)}
            balance={balances[item.contract_address]}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button  className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
    </div>
  );
}

export function HotFeed() {
  const [isHover, setHover] = useState<boolean>(false);
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [dispClankers, setDispClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)
  const [apeAmount, setApeAmount] = useState<number | null>(null)

  const { address } = useAccount()
  const [balances, setBalances] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isHover) {
      return;
    }
    setDispClankers(clankers)
  }, [clankers, isHover])

  useEffect(() => {
    async function checkBalance() {
      const balances = await serverFetchBalance(address)
      setBalances(balances)
    }
    void checkBalance()
  }, [address])

  async function processNewLiveTrade(ca: string) {
    ca = ca.toLowerCase()
    const existing = clankers.find(c => c.contract_address.toLowerCase() === ca)
    if (existing) {
      // bump existing to the top of clankers
      setClankers(prevClankers => [existing, ...prevClankers.filter(c => c.contract_address.toLowerCase() !== existing.contract_address.toLowerCase())])
    } else {
      const data = await serverFetchCA(ca)
      setClankers(prevClankers => [data, ...prevClankers.filter(c => c.contract_address.toLowerCase() !== data.contract_address.toLowerCase()).slice(0, 39)])
    }
  }

  useEffect(() => {
    const fetchClankers = async () => {
      setRefreshing(true);
      const data = await serverFetchHotClankers();
      setClankers(data);
      setRefreshing(false);
    };

    void fetchClankers();

    // Connect to the socket.io server
    const socket = io('https://rt.clank.fun');
    console.log('Connecting to clank.fun socket.io server');

    // Listen for new clankers
    socket.on('clankers', (clanker) => {
      console.log('New trade:', clanker.contract_address);
      if (isHover) {
        console.log('Ignoring new trade, user is currently hovering over a clanker');
        return;
      }
      void processNewLiveTrade(clanker.contract_address);
    });

    // Clean up the socket connection on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  function onApe(clanker: ClankerWithData, eth: number) {
    setApeAmount(eth)
    setDetailClanker(clanker)
  }

  return (
    <div className="w-full">
      {dispClankers.length === 0 && (
        <Loader text="Loading hot clankers"  />
      )}
      <motion.div className="w-full h-full grid lg:grid-cols-2 grid-cols-1 xl:grid-cols-3 gap-4">
        {dispClankers[0] && <motion.div
          key={dispClankers[0].contract_address}
          animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.4 }}
        >
          <ClankItem
            c={dispClankers[0]}
            onSelect={() => setDetailClanker(dispClankers[0] ?? null)}
            onApe={(eth) => onApe(dispClankers[0]!, eth)}
            balance={balances[dispClankers[0].contract_address]}
            onHover={setHover}
          />
        </motion.div>}
        {dispClankers.slice(1).map((item, i) => (
          <ClankItem
            key={i + 1}
            c={item}
            onSelect={() => setDetailClanker(item)}
            onApe={(eth) => onApe(item, eth)}
            balance={balances[item.contract_address]}
            onHover={setHover}
          />
        ))}
      </motion.div>
      <div className="w-full flex lg:flex-row flex-col gap-4 mt-4">
        <a href={shareUrl()} className="w-full">
          <Button  className="w-full mb-4" disabled={refreshing}>
            <Share size={16} className="mr-2" />
            Love clank.fun? Share it on Warpcast!
          </Button>
        </a>
      </div>
      <BuyModal 
        clanker={detailClanker} 
        onOpenChange={() => setDetailClanker(null)} 
        apeAmount={apeAmount}
        onAped={() => setApeAmount(null)}
      />
    </div>
  );
}

function formatBalance(balance: number, decimals: number) {
  balance = balance / 10 ** decimals

  // examples: 50k, 52.4m, 1.2b
  if (balance < 1000) {
    return balance.toFixed(2);
  } else if (balance < 1000000) {
    return (balance / 1000).toFixed(2) + "k";
  } else if (balance < 1000000000) {
    return (balance / 1000000).toFixed(2) + "m";
  } else {
    return (balance / 1000000000).toFixed(2) + "b";
  }
}

function formatPrice(price: number) {
  // examples: 50k, 52.4m, 1.2b
  if (price < 1000) {
    return price.toFixed(2);
  } else if (price < 1000000) {
    return (price / 1000).toFixed(2) + "k";
  } else if (price < 1000000000) {
    return (price / 1000000).toFixed(2) + "m";
  } else {
    return (price / 1000000000).toFixed(2) + "b";
  }
}

function ClankItem({ 
  c, 
  onSelect, 
  onApe, 
  balance,
  onHover
}: { 
  c: ClankerWithData, 
  onSelect?: () => void, 
  onApe: (eth: number) => void, 
  balance?: number,
  onHover?: (isHovered: boolean) => void
}) {
  const { toast } = useToast()
  const [isHovered, setIsHovered] = useState(false)

  function copyAddressToClipboard() {
    void navigator.clipboard.writeText(c.contract_address);
    toast({
      title: "Copied!",
      description: "Copied the CA address for " + c.name,
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(false)
  }

  return (
    <div
      className={`cursor-pointer w-full flex flex-row p-4 bg-slate-950 rounded-lg ${isHovered ? 'border border-white/30' : 'border border-white/10'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      <div className="mb-4 md:mb-0 w-36 h-36 flex-none flex items-center justify-center overflow-hidden rounded">
        <WithTooltip text={`Trade ${c.name}`}>
        <div className="w-full h-full" onClick={onSelect}>
          {c.img_url ? (
            <motion.div
              className="relative w-full h-full"
              whileHover={{
                rotate: 5,
                scale: 0.9,
                rotateX: 10,
                rotateY: 10,
              }}
            >
              <img
                src={c.img_url ?? ""}
                alt=""
                className="cursor-pointer w-full h-full object-contain"
              />
              {balance && <BalanceView balance={balance} decimals={c.decimals} priceUsd={c.priceUsd} />}
            </motion.div>
          ) : (
            <motion.div
              className="relative w-full h-full bg-purple-900 grid place-items-center text-4xl text-white/50"
              whileHover={{
                rotate: 5,
                scale: 0.9,
                rotateX: 10,
                rotateY: 10,
              }}
            >
              <ChartNoAxesColumnIncreasing className="w-1/3 h-1/3 text-white" />
              {balance && <BalanceView balance={balance} decimals={c.decimals} priceUsd={c.priceUsd} />}
            </motion.div>
          )}
        </div>
        </WithTooltip>
      </div> 
      <div className="flex-grow pl-2">
        <div className="pl-2">
          <div className="flex w-full items-start gap-2">
            <WithTooltip text={`Trade ${c.name}`}>
              <p className="font-bold text-lg flex-grow cursor-pointer text-ellipsis" onClick={onSelect}>
                {c.name}
              </p>
            </WithTooltip>
            <WithTooltip text="Launched">
              <motion.div
                animate={{
                  backgroundColor: moment(c.created_at).isAfter(moment().subtract(10, 'minutes')) ? ['#9f7aea', '#c084fc', '#9f7aea'] : [],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: 'easeInOut',
                }}
                className="flex-none rounded-md bg-slate-800 px-2 py-1 text-xs flex gap-2 items-center"
              >
                <Clock size={16} />
                {moment(c.created_at).fromNow(true)}
              </motion.div>
            </WithTooltip>
          </div>
          <p className="font-bold text-xs flex-grow cursor-pointer" onClick={onSelect}>
            (${c.symbol})
          </p>
          <div className="flex gap-4 mt-2 text-lg">
            <WithTooltip text="Market Cap">
              <div className="flex items-center gap-1">
                <DollarSign size={16} />
                <span>{c.marketCap === -1 ? "N/A" : `${formatPrice(c.marketCap)}`}</span>
              </div>
            </WithTooltip>
              {c.cast && (
                <WithTooltip text="Total cast engagement">
                <motion.div
                  animate={{
                    scale: c.cast.reactions.likes_count + c.cast.reactions.recasts_count + c.cast.replies.count > 50 ? [1, 1.2, 1] : [],
                    color: c.cast.reactions.likes_count + c.cast.reactions.recasts_count + c.cast.replies.count > 50 ? [
                      "#ff0000",
                      "#ffa500",
                      "#ffff00",
                      "#008000",
                      "#0000ff",
                      "#4b0082",
                      "#ee82ee",
                      "#ff0000",
                    ] : ["#ffffff"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "easeInOut",
                  }}
                  className="flex items-center gap-1"
                >
                  <Zap size={16} />
                  <span>{c.cast.reactions.likes_count + c.cast.reactions.recasts_count + c.cast.replies.count}</span>
                </motion.div>
                </WithTooltip>
              )}
          </div>
        </div>
        {c.cast && (
          <WithTooltip text="View on Warpcast">
            <AnonCast cast={c.cast} />
          </WithTooltip>
        )}
      </div>
    </div>
  )
}

function BalanceView({ balance, decimals, priceUsd }: { balance: number, decimals: number, priceUsd: number }) {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-bl from-pink-500 to-purple-500  text-white p-1 grid place-items-center">
      <span className="text-xs">you own ${formatPrice(priceUsd * balance / 10**decimals)}</span>
    </div>
  )
}

function Nav({ 
  refreshing, 
  view, 
  setView,
  setSearchQuery,
}: { 
  refreshing: boolean, 
  view: NavPage, 
  setView: (view: NavPage) => void 
  setSearchQuery: (query: string) => void
}) {
  return (
    <nav className="w-full flex flex-col gap-2 sticky top-0 bg-slate-900 pb-2 z-[9]">
      <div className="flex items-center gap-4 md:mb-4 text-white font-bold text-2xl">
        <div className="flex-grow flex flex-row gap-2 items-center">
          <Logo />
          <div className="flex-col">
            <h1 className="text-xl">
              clank.fun
            </h1>
            <p className="text-xs font-muted-foreground hidden md:block">
              find and trade hot memes on Base
            </p>
          </div>
        </div>
        <CastButtonDialog refreshing={refreshing} />
        <div className="text-sm flex-none">
          <ConnectKitButton />
        </div>
      </div>
      <div className="w-full flex gap-2">
        <div className="w-full max-w-[400px] flex justify-start gap-2">
          <Button
            variant="outline"
            className={`flex-grow ${view === "hot" ? "bg-white/10" : "bg-transparent"} hover:bg-white/20`}
            onClick={() => setView("hot")}
          >
            <span className="hidden md:block">
              Hot 
            </span>
            🔥
          </Button>
          <Button
            variant="outline"
            className={`flex-grow ${view === "top" ? "bg-white/10" : "bg-transparent"} hover:bg-white/20`}
            onClick={() => setView("top")}
          >

            <span className="hidden md:block">
              Top 
            </span>
            🚀
          </Button>
          <Button
            variant="outline"
            className={`flex-grow ${view === "latest" ? "bg-white/10" : "bg-transparent"} hover:bg-white/20`}
            onClick={() => setView("latest")}
          >
            <span className="hidden md:block">
              New
            </span>
            ⏰
        </Button>
        </div>
        <div className="flex-grow flex justify-end">
          <ClankerSearch 
            selected={view === "search"}
            onQueryUpdate={(v) => {
              setSearchQuery(v)
              if (v.length > 0) {
                setView("search")
              }
            }} />
        </div>
      </div>
    </nav>
  )
}

export default function ClankerSearch({
  selected,
  onQueryUpdate, 
}: {
  selected: boolean
  onQueryUpdate: (q: string) => void
}) {

  const [query, setQuery] = useState("")
  const debouncedQueryUpdate = useCallback(
    debounce((q: string) => onQueryUpdate(q), 500),
    []
  )

  useEffect(() => {
    debouncedQueryUpdate(query)
  }, [query, debouncedQueryUpdate])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input 
          id="input-26" 
          className={`peer pe-9 ps-9 ${selected ? "bg-white/10" : "bg-transparent"}`}
          placeholder="Search clankers..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search" />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Search size={16} strokeWidth={2} />
        </div>
        <button
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Submit search"
          type="submit"
        >
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}


function Logo() {
  return (
    <div className="w-12 h-12 rounded grid place-items-center text-3xl bg-slate-900">
      <motion.div
        animate={{ rotateX: [-60, 40], rotateY: [-40, 60] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="relative"
      >
        <motion.div
          animate={{ rotateX: [40, -40], rotateY: [40, -40], x: [-2, 2], y: [-2, 2] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 text-red-500/30"
        >
          <ChartNoAxesColumnIncreasing />
        </motion.div>
        <motion.div
          animate={{ rotateX: [-60, 60], rotateY: [-40, 40], x: [2, -2], y: [2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 text-green-500/30"
        >
          <ChartNoAxesColumnIncreasing />
        </motion.div>
        <div>
          <ChartNoAxesColumnIncreasing />
        </div>
      </motion.div>
    </div>
  )
}

const ReactionStat = ({ icon: Icon, count, id }: { icon: React.ReactNode, count: number, id: string }) => {
  const prevCount = useRef(count);
  const prevId = useRef(id);

  const shouldAnimate = prevCount.current !== count && prevId.current === id;

  useEffect(() => {
    prevCount.current = count;
    prevId.current = id;
  }, [count, id]);

  return (
    <motion.div
      style={{ display: "flex", alignItems: "center", gap: "4px" }}
      animate={{ scale: shouldAnimate ? 1.2 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={shouldAnimate ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        {Icon}
      </motion.div>
      <span>{count}</span>
    </motion.div>
  );
};

import { useAccount } from "wagmi";
import { SwapInterface } from "./swap";
import { Input } from "~/components/ui/input";
import { debounce, set } from "lodash";

function BuyModal({ 
  clanker, 
  onOpenChange,
  apeAmount,
  onAped,
}: { 
  clanker: ClankerWithData | null, 
  onOpenChange: (visible: boolean) => void 
  apeAmount: number | null
  onAped: () => void
}) {

  return (
    <Dialog open={clanker !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%]">
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Trade {clanker?.name}</DialogTitle>
          </VisuallyHidden.Root>
        </DialogHeader>
        <div className="h-full w-full flex flex-col lg:flex-row gap-4">
          {clanker?.pool_address && <iframe 
            className="hidden lg:block rounded-lg w-full h-[700px]"
            id="geckoterminal-embed" 
            title="GeckoTerminal Embed" 
            src={`https://www.geckoterminal.com/base/pools/${clanker?.pool_address}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0`}
            allow="clipboard-write"
          >
          </iframe>}
          <div className="flex-grow">
            <div className="flex gap-4 items-center text-xl mb-2">
              {clanker?.img_url && <img src={clanker?.img_url} alt="" className="w-12 h-12 rounded-full" />}
              <div>
                <p className="md:text-2xl">
                  trade <span className="font-bold">{clanker?.name}</span>
                </p>
                <p className="text-white/50 text-xs md:text-sm">
                  Swaps routed through 0x protocol
                </p>
              </div>
            </div>
            {clanker && 
              <SwapInterface 
                clanker={clanker} 
                apeAmount={apeAmount} 
                onAped={onAped}
                onSwapComplete={() => onOpenChange(false)}
              />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CastButtonDialog({ refreshing }: { refreshing: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-500">
          <span className="hidden md:block">
            What is this?
          </span>
          <span className="md:hidden">
            ???
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>find and trade the hottest coins on Base</DialogTitle>
          <p className="text-muted-foreground">
            clank.fun lets you discover and trade coins minted with the Clanker protocol on Base. 
          </p>
          <p className="text-muted-foreground">
            all Clanker tokens are fair-launched by users on Farcaster, and traded via a UniswapV3 pair on Base.
          </p>
          <p className="text-muted-foreground">
            clank.fun was built by <a href="https://warpcast.com/nt" target="_blank" rel="noreferrer" className="underline">@nt</a>
          </p>
          <p className="text-muted-foreground">
            learn more about Clanker and Farcaster:
          </p>
          <div className="flex gap-4 justify-center md:justify-normal">
            <a href="https://clanker.world" target="_blank" rel="noreferrer" className="underline">
              Clanker
            </a>
            <a href="https://warpcast.com" target="_blank" rel="noreferrer" className="underline">
              Farcaster 
            </a>
          </div>
          <div className="flex gap-4 justify-center md:justify-normal">
            <a href="https://t.me/clankfunn" target="_blank" rel="noreferrer" className="underline">
              Join the Telegram community
            </a>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function Loader({
  text
}: {
  text?: string
}) {
  return (
    <motion.div
      className="text-white text-center p-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      <div className="flex justify-center gap-4">
        {text}
        <motion.div
          className="text-4xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1],
            opacity: [0.25, 1, 0.25],
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
        >
          <ChartAreaIcon />
        </motion.div>
        <motion.div
          className="text-4xl"
          animate={{
            rotate: [360, 0],
            scale: [1, 1.5, 1],
            opacity: [0.25, 1, 0.25],
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
        >
          <ChartAreaIcon />
        </motion.div>
        <motion.div
          className="text-4xl"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.5, 1],
            opacity: [0.25, 1, 0.25],
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
        >
          <ChartAreaIcon />
        </motion.div>
      </div>
    </motion.div>
  )
}

function AnonCast({ cast, isParent }: { cast: CastWithInteractions, isParent?: boolean }) {
  const [parent, setParent] = useState<CastWithInteractions | null>(null);

  async function fetchParent(cast: CastWithInteractions) {
    return
    // if (!cast.parent_hash) {
    //   return
    // }
    // const parent = await fetchParentCast(cast.parent_hash)
    // if (parent) {
    //   setParent(parent)
    // }
  }

  useEffect(() => {
    if (isParent) return
    void fetchParent(cast)
  }, [cast, isParent])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.05,
        repeat: 4,
        repeatType: "reverse",
      }}
      className="w-full"
    >
      <div style={!isParent ? {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "10px",
        width: "100%",
      }: { width: "100%"}} className="w-full">
        {parent && (
          <AnonCast cast={parent} isParent />
        )}
        {parent && (
          <div className="h-2"/>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "8px",
          }}
          className="w-full"
        >
          {parent && (
            <Reply size={24} style={{ transform: "rotate(180deg)" }} className="flex-none" />
          )}
          <a
            href={`https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-none"
          >
            <img
              src={cast.author.pfp_url}
              alt=""
              className="w-8 h-8 rounded-full flex-none"
            />
          </a>
          <a
            href={`https://warpcast.com/${cast.author.username}/${cast.hash.slice(0, 10)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <div className="w-full">
              <div className="w-full">
                <div className="w-full font-bold">
                  {cast.author.display_name}
                </div>
                <div className="w-full flex items-center text-white/50 text-sm mb-2">
                  {cast.author.follower_count}
                  <Users size={16} className="ml-1" />
                </div>
                {cast.text && (
                  <p className="text-white leading-tight text-xs">{cleanText(cast.text)}</p>
                )}
                {false && cast.embeds.map((embed, i) => {
                  if (embed.hasOwnProperty('cast')) {
                    const c = (embed as EmbedCast).cast;
                    return <div className="px-4 py-2 border border-white/20 rounded mt-2" key={i}>{cleanText(c.text)}</div>
                  } else {
                    const c = (embed as EmbedUrl)
                    if (c.metadata?.image) {
                      return (
                        <img
                          key={i}
                          src={c.url}
                          alt=""
                          className="max-w-[600px] w-full mt-4 mb-1"
                        />
                      );
                    } else {
                      return null
                    }
                  }
                })}
              </div>
              <div className="w-full flex items-center gap-2 text-gray-500 text-sm mt-2">
                <ReactionStat icon={<LucideHeart size={16} />} count={cast.reactions.likes_count} id={cast.hash} />
                <ReactionStat icon={<LucideRotateCcw size={16} />} count={cast.reactions.recasts_count} id={cast.hash} />
                <ReactionStat icon={<LucideMessageCircle size={16} />} count={cast.replies.count} id={cast.hash} />
                <span className="flex-grow"></span>
                <span>{new Date(cast.timestamp).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric' })}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </motion.div>
  )
}