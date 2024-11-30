"use client"

import { serverFetchSwapPrice, serverFetchSwapQuote, type ClankerWithData } from "./server";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { useAccount, useBalance, useReadContract, useSendTransaction, useSignTypedData, useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import {
  concat,
  erc20Abi,
  numberToHex,
  size,
} from "viem";
import type { Address, Hex } from "viem";

const MAX_ALLOWANCE =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"

export function SwapInterface({ clanker }: { clanker: ClankerWithData }) {
  const [amount, setAmount] = useState<number>(0);
  const [isBuying, setIsBuying] = useState(true);
  const [error, setError] = useState("");
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [priceRes, setPriceRes] = useState<any>(null);
  const [cancelRequest, setCancelRequest] = useState<boolean>(false);

  const sellTokenAddress = isBuying ? WETH_ADDRESS : clanker.contract_address as `0x${string}`;

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
      setPriceRes(res);
      setCancelRequest(false);
    }
  }

  const {
    data: hash,
    isPending,
    error: transactionError,
    sendTransaction,
  } = useSendTransaction();

  const { signTypedDataAsync } = useSignTypedData()

  // STEP 1: User clicks swap, fetch quote, set swapQuote and initiate signature
  async function initiateSwap() {
    if (!address || !clanker || amount <= 0 ) return;
    const quote = await serverFetchSwapQuote(
      address, 
      clanker.contract_address, 
      amount, 
      !isBuying
    )

    if (!quote.permit2?.eip712) return
    if (!quote.transaction) return

    const signature = await signTypedDataAsync(quote.permit2.eip712)
    const signatureLengthInHex = numberToHex(size(signature), {
      signed: false,
      size: 32,
    });

    const transactionData = quote.transaction.data as Hex;
    const sigLengthHex = signatureLengthInHex as Hex;
    const sig = signature as Hex;

    quote.transaction.data = concat([
      transactionData,
      sigLengthHex,
      sig,
    ]);

    sendTransaction &&
    sendTransaction({
      account: address,
      gas: !!quote?.transaction.gas
        ? BigInt(quote?.transaction.gas)
        : undefined,
      to: quote?.transaction.to,
      data: quote.transaction.data, // submit
      value: quote?.transaction.value
        ? BigInt(quote.transaction.value)
        : undefined, // value is used for native tokens
      chainId: 8453,
    });
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
      <ApproveOrReviewButton 
        onClick={initiateSwap} 
        taker={address as Address} 
        sellTokenAddress={sellTokenAddress} 
        disabled={!!error || cancelRequest} 
        price={priceRes} 
      />
    </div>
  );
}

function ApproveOrReviewButton({
  taker,
  onClick,
  sellTokenAddress,
  disabled,
  price,
}: {
  taker: Address;
  onClick: () => void;
  sellTokenAddress: Address;
  disabled?: boolean;
  price: any;
}) {
  // If price.issues.allowance is null, show the Review Trade button
  if (price?.issues.allowance === null) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          // fetch data, when finished, show quote view
          onClick();
        }}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-25"
      >
        {disabled ? "Insufficient Balance" : "Review Trade"}
      </button>
    );
  }

  // Determine the spender from price.issues.allowance
  const spender = price?.issues.allowance.spender;

  // 1. Read from erc20, check approval for the determined spender to spend sellToken
  const { data: allowance, refetch } = useReadContract({
    address: sellTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [taker, spender],
  });
  console.log("checked spender approval");

  // 2. (only if no allowance): write to erc20, approve token allowance for the determined spender
  const { data } = useSimulateContract({
    address: sellTokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, MAX_ALLOWANCE],
  });

  // Define useWriteContract for the 'approve' operation
  const {
    data: writeContractResult,
    writeContractAsync: writeContract,
    error,
  } = useWriteContract();

  // useWaitForTransactionReceipt to wait for the approval transaction to complete
  const { data: approvalReceiptData, isLoading: isApproving } =
    useWaitForTransactionReceipt({
      hash: writeContractResult,
    });

  // Call `refetch` when the transaction succeeds
  useEffect(() => {
    if (data) {
      refetch();
    }
  }, [data, refetch]);

  if (error) {
    return <div>Something went wrong: {error.message}</div>;
  }

  if (allowance === 0n) {
    return (
      <>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          onClick={async () => {
            await writeContract({
              abi: erc20Abi,
              address: sellTokenAddress,
              functionName: "approve",
              args: [spender, MAX_ALLOWANCE],
            });
            console.log("approving spender to spend sell token");

            refetch();
          }}
        >
          {isApproving ? "Approving…" : "Approve"}
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        // fetch data, when finished, show quote view
        onClick();
      }}
      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-25"
    >
      {disabled ? "Insufficient Balance" : "Review Trade"}
    </button>
  );
}