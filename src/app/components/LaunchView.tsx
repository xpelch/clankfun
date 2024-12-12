import { useEffect, useState } from "react";
import { ClankItem, Nav } from "../app";
import { ClankerWithData } from "../server";
import { FInput } from "./FInput";
import { FImageUpload } from "./FImageUpload";
import { useAccount, useSignMessage } from "wagmi";
import { FConnectButtonLarge } from "./FConnectButton";
import { Button } from "~/components/ui/button";
import { serverLaunchToken } from "../server-launch";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "next/navigation";

export function LaunchView() {
  const { toast } = useToast()

  const [nonce, setNonce] = useState<string|null>(null);
  const [launching, setLaunching] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { address } = useAccount()
  const { isPending: signPending, signMessageAsync } = useSignMessage()

  useEffect(() => {
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNonce(randomString);
  }, []);

  const canLaunch = nonce && name.length > 0 && ticker.length > 0 && address
  let buttonName = "Launch"
  if (signPending) {
    buttonName = "Sign in wallet"
  }

  const router = useRouter()

  async function launchToken() {
    setLaunching(true)
    try {
      const canLaunch = nonce && name.length > 0 && ticker.length > 0 && address
      if (!canLaunch) return;
      const signature = await signMessageAsync({ message: nonce })
      console.log(signature)

      console.log("Name:", name)
      console.log("Ticker:", ticker)
      console.log("Image:", image)
      console.log("Address:", address)
      console.log("Nonce:", nonce)
      console.log("Signature:", signature)

      const ca = await serverLaunchToken({
        name,
        ticker,
        image,
        address,
        nonce: nonce!,
        signature
      });
      router.push(`/t/${ca}`);

      toast({
        title: "Token launched!",
      })
    } catch(e: any) {
      console.error("Failed to launch token", e.message)
      toast({
        title: "Error launching token",
        description: e.message
      })
    } finally {
      setLaunching(false)
    }
  }

  const previewClanker = {
    name: name.length > 0 ? name : "[Your Token]",
    symbol: ticker.length > 0 ? ticker : "[YOURTICKER]",
    img_url: image,
    pool_address: "",
    cast_hash: "",
    type: "clank",
    id: 0,
    created_at: new Date().toString(),
    tx_hash: "",
    requestor_fid: 0,
    contract_address: "",
    marketCap: 40000,
    decimals: 6,
    priceUsd: 0,
    cast: null
  } as ClankerWithData

  return (
    <div className="grid place-items-center">
      <div className="w-full max-w-[600px] flex flex-col items-center justify-center gap-6">
        <div className="w-full">
          <span className="text-white text-[28px] font-medium   leading-7">
            Launch a token with
            <br />
          </span>
          <span className="text-[#b4a2ff] text-[28px] font-medium   leading-7">
            Clanker
          </span>
          <span className="text-white text-[28px] font-medium   leading-7">
            {" "}
            via clank.fun
          </span>
        </div>
        <div className="w-full">
          <ClankItem c={previewClanker} />
        </div>
        <div className="w-full flex flex-col items-start justify-start gap-4">
          <div className="h-[53px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Name
            </div>
            <FInput value={name} onChange={setName} placeholder="Enter token name" />
          </div>
          <div className="h-[53px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Ticker
            </div>
            <FInput value={ticker} onChange={setTicker} placeholder="Enter ticker" />
          </div>
          <div className="h-[223px] flex flex-col items-start justify-start gap-2 w-full">
            <div className="w-full   text-[15px] font-medium leading-[15px] text-white">
              Token image
            </div>
            <FImageUpload onImage={setImage} />
          </div>
        </div>
        {address ? (<Button onClick={launchToken} className="w-full h-[46px] flex items-center justify-center gap-1 rounded-[10px] bg-[#7962d9] hover:bg-[#7962d9] px-[9px]" disabled={!canLaunch || launching}>
          <div className="  text-[15px] font-medium leading-[15px] text-white">
            {buttonName}
          </div>
        </Button>) : (
          <FConnectButtonLarge />
        )}
      </div>
    </div>
  );
}
