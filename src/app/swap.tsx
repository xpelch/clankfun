"use client"

import { serverFetchSwapPrice, type ClankerWithData } from "./server";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import { set } from "zod";

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"

export function SwapInterface({ clanker }: { clanker: ClankerWithData }) {
  const [amount, setAmount] = useState<number>(0);
  const [isBuying, setIsBuying] = useState(true);
  const [error, setError] = useState("");
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [cancelRequest, setCancelRequest] = useState<boolean>(false);

  const { address } = useAccount()
  const { data: ethBalance, isError: ethBalanceError } = useBalance({
    address,
    token: WETH_ADDRESS,
  });
  const { data: tokenBalance, isError: tokenBalanceError } = useBalance({
    address,
    token: clanker.contract_address as `0x${string}`,
  });

  function balances() {
    return {
      eth: ethBalance ? parseFloat(ethers.formatEther(ethBalance.value)) : 0,
      token: tokenBalance ? parseFloat(ethers.formatEther(tokenBalance.value)) : 0,
    }
  }

  const handlePercentageChange = (newPercentage: number) => {
    const { eth, token } = balances();
    const newAmount = isBuying ? eth * (newPercentage / 100) : token * (newPercentage / 100);
    setAmount(newAmount);
  };

  useEffect(() => {
    let cancelled = false;
    void updateSwapAmount(cancelled);
    return () => { cancelled = true; }
  }, [amount, isBuying]);

  async function updateSwapAmount(cancelled: boolean) {
    if (!address || !clanker || cancelled) return;
    setCancelRequest(true);
    const res = await serverFetchSwapPrice(
      address, 
      clanker.contract_address, 
      amount, 
      !isBuying
    );

    if (!cancelled) {
      const buyAmount = parseFloat(ethers.formatEther(res.buyAmount));
      setBuyAmount(buyAmount);
      setCancelRequest(false);
    }
  }

  const handleUpdateAmount = async (newAmount: number) => {
    const { eth, token } = balances();
    const clampedAmount = Math.min(newAmount, isBuying ? eth : token);
    setAmount(clampedAmount);
  }

  const handleTabSwitch = () => {
    setIsBuying(!isBuying);
    setAmount(0);
    setBuyAmount(0);
    setCancelRequest(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList>
          <TabsTrigger value="buy" onClick={handleTabSwitch}>
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" onClick={handleTabSwitch}>
            Sell
          </TabsTrigger>
        </TabsList>
        <div role="tabpanel">
          <TabsContent value="buy">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span>From</span>
                <span>WETH</span>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => handleUpdateAmount(parseFloat(e.target.value))}
              />
              {ethBalance && <span className="text-gray-500">Balance: {ethers.formatEther(ethBalance.value)}</span>}
              <div className="flex justify-between items-center gap-2 pointer-events-none mt-2">
                <span>To</span>
                <div className="flex-none flex gap-2">
                  <img src={clanker.img_url ?? ""} alt={clanker.name} className="w-6 h-6 rounded-full" />
                  <span>{clanker.symbol}</span>
                </div>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                disabled
              />
              <div className="flex justify-between">
                <Button onClick={() => handlePercentageChange(25)}>25%</Button>
                <Button onClick={() => handlePercentageChange(50)}>50%</Button>
                <Button onClick={() => handlePercentageChange(75)}>75%</Button>
                <Button onClick={() => handlePercentageChange(100)}>100%</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sell">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span>From</span>
                <div className="flex-none flex gap-2">
                  <img src={clanker.img_url ?? ""} alt={clanker.name} className="w-6 h-6 rounded-full" />
                  <span>{clanker.symbol}</span>
                </div>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
              />
              {tokenBalance && <span className="text-gray-500">Balance: {ethers.formatEther(tokenBalance.value)}</span>}
              <div className="flex justify-between items-center gap-2 pointer-events-none mt-2">
                <span>To</span>
                <span>WETH</span>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                disabled
              />
              <div className="flex justify-between">
                <Button onClick={() => handlePercentageChange(25)}>25%</Button>
                <Button onClick={() => handlePercentageChange(50)}>50%</Button>
                <Button onClick={() => handlePercentageChange(75)}>75%</Button>
                <Button onClick={() => handlePercentageChange(100)}>100%</Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <Button className="w-full" disabled={!!error || cancelRequest}>
        {isBuying ? "Buy" : "Sell"} {clanker.name}
      </Button>
    </div>
  );
}