"use server"

import axios from 'axios';
import { redirect } from 'next/navigation';

import { verifyMessage } from 'viem';
import { env } from '~/env';

export async function serverLaunchToken({
  name, ticker, image, address, nonce, signature
}: {
  name: string,
  ticker: string,
  image: string | null,
  address: `0x${string}`,
  nonce: string,
  signature: any,
}) {
  const valid = await verifySignature(
    nonce,
    signature,
    address
  )
  if (!valid) {
    throw new Error("Invalid signature")
  }

  // Call API
  const apiUrl = 'https://www.clanker.world/api/tokens/deploy';
  const apiKey = env.CLANKER_API_KEY

  const requestData = {
    name,
    symbol: ticker,
    image,
    requestorAddress: address,
    requestKey: nonce,
  };

  const response = await axios.post(apiUrl, requestData, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  console.log('Token deployment response:')
  console.log(JSON.stringify(response.data, null, 2))
  if (!response.data.contract_address) {
    throw new Error("Failed to deploy token")
  }
  return redirect(`/t/${response.data.contract_address}`)
}

async function verifySignature(
  message: string,
  signature: any,
  address: `0x${string}`
): Promise<boolean> {
  // Recover the address from the signature
  const valid = await verifyMessage({
    address,
    message,
    signature,
  });

  return valid
}