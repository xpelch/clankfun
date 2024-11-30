"use client"

import { serverEthUSDPrice, serverFetchSwapPrice, serverFetchSwapQuote, type ClankerWithData } from "./server";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
import { useToast } from "~/hooks/use-toast";

const MAX_ALLOWANCE =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function SwapInterface({ clanker, apeAmount }: { clanker: ClankerWithData, apeAmount: number | null }) {

  const { toast } = useToast()
  const [amount, setAmount] = useState<number>(0);
  const [isBuying, setIsBuying] = useState(true);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [priceRes, setPriceRes] = useState<any>(null);
  const [ethPrice, setEthPrice] = useState<number>(3600);

  useEffect(() => {
    async function fetchPrice() {
      setEthPrice(await serverEthUSDPrice())
    }
    void fetchPrice()
  }, [])

  const swapUSDAmount =  isBuying ? amount * ethPrice : buyAmount * ethPrice;
  const sellTokenName = isBuying ? "WETH" : clanker.symbol;
  const buyTokenName = isBuying ? clanker.symbol : "WETH";

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

  useEffect(() => {
    console.log(apeAmount, ethBalance)
    if (!apeAmount || !ethBalance) return;
    const balance = balances().eth
    if (apeAmount > balance) {
      toast({
        title: "Insufficient balance",
        description: "You do not have enough WETH to make this trade. Please choose a different amount"
      })
    } else {
      toast({
        title: "Aping in 🦍",
      })

      setAmount(apeAmount)
      setIsBuying(true)
      startSwap(apeAmount, true)
    }
  }, [apeAmount, ethBalance])

  async function updateSwapAmount(cancelled: boolean) {
    if (!address || !clanker || cancelled) return;
    const res = await serverFetchSwapPrice(
      address, 
      clanker.contract_address, 
      amount, 
      !isBuying
    );
    if (!res.buyAmount) return;

    if (!cancelled) {
      const buyAmount = parseFloat(ethers.formatEther(res.buyAmount));
      setBuyAmount(buyAmount);
      setPriceRes(res);
    }
  }

  const {
    data: hash,
    isPending: transactionPending,
    error: transactionError,
    sendTransaction,
  } = useSendTransaction();

  const { data: receipt, isLoading: waitingForReceipt, error: waitingError } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (waitingForReceipt) {
      toast({
        title: "Transaction pending",
        description: "Your transaction is being processed.",
      });
    }
    if (receipt) {
      toast({
        title: "Success!",
        description: "Your transaction was successful.",
      })
    }
    if (waitingError) {
      toast({
        title: "Failed",
        description: "Your transaction has failed. Please try again.",
      })
    }
  }, [receipt, waitingForReceipt, waitingError]);

  const [userShouldApprove, setUserShouldApprove] = useState(false);

  const { signTypedDataAsync, isPending: signPending } = useSignTypedData()

  async function startSwap(amount: number, isBuying: boolean) {
    if (!address || !clanker || amount <= 0 ) return;
    console.log("Fetching quote")
    const quote = await serverFetchSwapQuote(
      address, 
      clanker.contract_address, 
      amount, 
      !isBuying
    )

    if (!quote.permit2?.eip712) return
    if (!quote.transaction) return

    console.log("Getting signature")
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

    setUserShouldApprove(true);
    console.log("Sending transaction")
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
    setUserShouldApprove(false);
  }

  async function initiateSwap() {
    startSwap(amount, isBuying);
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
  };

  const actionPending = transactionPending || signPending;

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
              </div>
              <div className="flex rounded-lg shadow-sm shadow-black/5">
                <Input
                  id="input-15"
                  className="-me-px rounded-e-none shadow-none"
                  placeholder="google"
                  value={amount}
                  onChange={(e) => handleUpdateAmount(parseFloat(e.target.value))}
                />
                <span className="-z-10 inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  WETH
                </span>
              </div>
              {ethBalance && <span className="text-gray-500 text-sm">Balance: {ethers.formatEther(ethBalance.value)}</span>}
              <div className="flex justify-between items-center gap-2 pointer-events-none mt-2">
                <span>To</span>
              </div>
              <div className="flex rounded-lg shadow-sm shadow-black/5 text-lg">
                <Input
                  id="input-15"
                  className="-me-px rounded-e-none shadow-none"
                  placeholder="google"
                  value={buyAmount}
                  disabled
                />
                <span className="-z-10 inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  <div className="flex gap-2 items-center">
                    {clanker.img_url && <img src={clanker.img_url ?? ""} alt={clanker.name} className="w-6 h-6 rounded-full" />}
                    <span className="mr-5">{clanker.symbol}</span>
                  </div>
                </span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sell">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span>From</span>
              </div>
              <div className="flex rounded-lg shadow-sm shadow-black/5">
                <Input
                  id="input-15"
                  className="-me-px rounded-e-none shadow-none"
                  placeholder="google"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                />
                <span className="-z-10 inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  <div className="flex gap-2 items-center">
                    {clanker.img_url && <img src={clanker.img_url ?? ""} alt={clanker.name} className="w-6 h-6 rounded-full" />}
                    <span className="mr-5">{clanker.symbol}</span>
                  </div>
                </span>
              </div>
              {tokenBalance && <span className="text-gray-500 text-sm">Balance: {ethers.formatEther(tokenBalance.value)}</span>}
              <div className="flex justify-between items-center gap-2 pointer-events-none mt-2">
                <span>To</span>
                <span>WETH</span>
              </div>
              <div className="flex rounded-lg shadow-sm shadow-black/5 text-lg">
                <Input
                  id="input-15"
                  className="-me-px rounded-e-none shadow-none"
                  placeholder="google"
                  value={buyAmount}
                  disabled
                />
                <span className="-z-10 inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  WETH
                </span>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <div className="flex justify-between gap-2">
        <Button className="w-full" size="sm" variant="secondary" onClick={() => handlePercentageChange(25)}>25%</Button>
        <Button className="w-full" size="sm" variant="secondary" onClick={() => handlePercentageChange(50)}>50%</Button>
        <Button className="w-full" size="sm" variant="secondary" onClick={() => handlePercentageChange(75)}>75%</Button>
        <Button className="w-full" size="sm" variant="secondary" onClick={() => handlePercentageChange(100)}>100%</Button>
      </div>
      <div>
        {swapUSDAmount > 0 && <span className="text-white/50">You will swap {formatUSD(swapUSDAmount)} {sellTokenName} for {buyTokenName}</span>}
      </div>
      {address ? <ApproveOrReviewButton 
        onClick={initiateSwap} 
        taker={address as Address} 
        sellTokenAddress={sellTokenAddress} 
        disabled={actionPending} 
        price={priceRes} 
        userShouldApprove={userShouldApprove}
      /> : <Button disabled={true}>Connect Wallet to Trade</Button>}
    </div>
  );
}

function ApproveOrReviewButton({
  taker,
  onClick,
  sellTokenAddress,
  disabled,
  price,
  userShouldApprove
}: {
  taker: Address;
  onClick: () => void;
  sellTokenAddress: Address;
  disabled?: boolean;
  price: any;
  userShouldApprove: boolean;
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
        {disabled ? "Swapping..." : userShouldApprove ? "Check Wallet" : "Swap"}
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
    if (data || approvalReceiptData) {
      refetch();
    }
  }, [data, approvalReceiptData, refetch]);

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
      {disabled ? "Swapping..." : "Swap"}
    </button>
  );
}
