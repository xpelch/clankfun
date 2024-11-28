/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

"use client"

import { useEffect, useRef, useState } from "react";
import { type ClankerWithData, serverFetchClankers } from "./server";
import { type EmbedCast, type EmbedUrl, type CastWithInteractions } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { motion } from 'framer-motion';
import { ChartAreaIcon, ChartCandlestick, ChartNoAxesColumnIncreasing, Clipboard, DollarSign, LucideHeart, LucideMessageCircle, LucideRotateCcw, Reply, Rocket, Share, Users, Zap } from "lucide-react";
import { WithTooltip } from "./components";
import { useToast } from "~/hooks/use-toast";

function shareUrl() {
  const url = new URL("https://warpcast.com/~/compose")
  url.searchParams.append("text", "Loving this slick new clanker app! 🔥")
  url.searchParams.append("embeds[]", "https://clank.fun")

  return url.toString()
}

function cleanText(text: string) {
  return text.split(" ").map((word) => {
    if (word.length > 15) {
      return word.slice(0, 15) + "...";
    }
    return word;
  }).join(" ");
}

export function App() {
  const [clankers, setClankers] = useState<ClankerWithData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [detailClanker, setDetailClanker] = useState<ClankerWithData | null>(null)

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

  return (
    <div className="w-full flex justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black p-2 lg:p-6">
      <div className="w-full">
        <Nav refreshing={refreshing} />
        <p className="py-2">
        </p>
        {clankers.length === 0 && (
          <Loader />
        )}
        <motion.div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clankers.map((item, i) => (
            <ClankItem key={i} c={item} onSelect={() => setDetailClanker(item)} />
          ))}
        </motion.div>
        <div className="w-full flex lg:flex-row flex-col gap-4">
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
      </div>
      <BuyModal clanker={detailClanker} onOpenChange={() => setDetailClanker(null)} />
    </div>
  );
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

function ClankItem({ c, onSelect }: { c: ClankerWithData, onSelect?: () => void }) {
  const { toast } = useToast()

  function copyAddressToClipboard() {
    void navigator.clipboard.writeText(c.contract_address);
    toast({
      title: "Copied!",
      description: "Copied the CA address for " + c.name,
    })
  }

  return (
    <div className="w-full flex flex-col md:flex-row p-4 bg-black rounded">
      <div className="mb-4 md:mb-0 w-full md:w-40 md:h-40 lg:w-48 lg:h-48 flex-none flex items-center justify-center overflow-hidden rounded">
        <div className="w-full h-full" onClick={onSelect}>
        {c.img_url ? (
          <motion.img
            src={c.img_url ?? ""}
            alt=""
            className="cursor-pointer w-full h-full object-contain"
            whileHover={{
              rotate: 5,
              scale: 0.9,
              rotateX: 10,
              rotateY: 10,
            }}
          />
        ) : (
          <motion.div
            className="cursor-pointer w-full h-full bg-purple-900 grid place-items-center text-4xl text-white/50"
            whileHover={{
              rotate: 5,
              scale: 0.9,
              rotateX: 10,
              rotateY: 10,
            }}
          >
            <ChartNoAxesColumnIncreasing className="w-1/3 h-1/3 text-white" />
          </motion.div>
        )}
        </div>
      </div> 
      <div className="flex-grow pl-2">
        <div className="pl-2">
          <div className="flex w-full items-center gap-2">
            <p className="font-bold text-xl flex-grow">
              {c.name} (${c.symbol})
            </p>
            <WithTooltip text="Copy CA">
              <Button size="icon" className="bg-slate-900 text-white hover:bg-slate-500" onClick={copyAddressToClipboard}>
                <Clipboard size={16} />
              </Button>
            </WithTooltip>
            <WithTooltip text="View on Clanker">
              <a href={`https://www.clanker.world/clanker/${c.contract_address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 flex-none">
                <Button size="icon" className="bg-slate-900 text-white hover:bg-slate-500">
                  <ChartNoAxesColumnIncreasing size={16} />
                </Button>
              </a>
            </WithTooltip>
            <WithTooltip text="View on DexScreener">
              <a href={`https://dexscreener.com/base/${c.contract_address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 flex-none">
                <Button size="icon" className="bg-slate-900 text-white hover:bg-slate-500">
                  <ChartCandlestick size={16} />
                </Button>
              </a>
            </WithTooltip>
          </div>
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
    // <pre className="border-white border-2 rounded p-4">
    //   {JSON.stringify(item, null, 2)}
    // </pre>
  )
}


function Nav({ refreshing }: { refreshing: boolean }) {
  return (
    <nav className="flex items-center gap-4 mb-2 text-white font-bold text-2xl">
      <div className="flex-grow flex flex-row gap-2 items-center">
        <Logo />
        <div className="flex-col">
          <h1 className="text-xl">
            clank.fun
          </h1>
          <p className="text-xs font-muted-foreground">
            the latest clanker memecoins on Farcaster
          </p>
        </div>
      </div>
      <CastButtonDialog refreshing={refreshing} />
    </nav>
  )
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

function BuyModal({ clanker, onOpenChange }: { clanker: ClankerWithData | null, onOpenChange: (visible: boolean) => void }) {
  return (
    <Dialog open={clanker !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buy Token</DialogTitle>
          <DialogDescription>
            Purchase this token
          </DialogDescription>
          Blah Blah Blah
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function CastButtonDialog({ refreshing }: { refreshing: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {refreshing ? 
        (<Button size="sm" disabled>
          Refreshing...
          </Button>) :
        (<Button size="sm" className="bg-slate-900 text-white hover:bg-slate-500">
          What is this?
        </Button>)}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>clank.fun is the unofficial clanker UI</DialogTitle>
          <DialogDescription>
            I (@nt) didn&apos;t like the official clanker UI built by proxy (it&apos;s not their fault - they&apos;re dealing with bigger problems than a nice website rn). So I built a better one. It uses the clanker APIs to fetch the latest tickers, and also fetches the market cap and farcaster post engagement. You can use it to hunt the latest clanker coins. 
          </DialogDescription>
          <ul className="mt-10">
            <li><a href="https://clanker.world/" target="_blank" rel="noopener noreferrer">visit the official Clanker site</a></li>
          </ul>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function Loader() {
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
        backgroundColor: "black",
        padding: "10px",
        borderRadius: "5px",
        marginBottom: "10px",
        boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)",
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
                <div className="w-full font-bold text-lg">
                  {cast.author.display_name}
                </div>
                <div className="w-full flex items-center text-white/50 text-sm mb-2">
                  {cast.author.follower_count}
                  <Users size={16} className="ml-1" />
                </div>
                {cast.text && (
                  <p className="text-white leading-tight">{cleanText(cast.text)}</p>
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