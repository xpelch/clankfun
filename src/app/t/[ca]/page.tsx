// Do not cache this page

// Set cache to 'no-store' to prevent Vercel from caching this page
export const dynamic = 'force-dynamic'
export const revalidate = 0


import { Nav, TradeApp } from "~/app/app";
import { getOrScrapeByCa } from "~/lib/clanker";
import { serverFetchCA } from "~/app/server";

export default async function Page({ 
  params: { ca }, 
}: { 
  params: { ca: string }, 
}) {
  await getOrScrapeByCa(ca)
  const data = await serverFetchCA(ca)
  if (!data) {
    return <div>Not found</div>
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col">
      <Nav refreshing={false} view="detail"/>
      <div className="px-2 md:px-6 flex-grow">
        <TradeApp clanker={data} />
      </div>
    </div>
  )
}