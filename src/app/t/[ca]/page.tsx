import { Nav, TradeApp } from "~/app/app";
import { getOrScrapeByCa } from "~/lib/clanker";
import { serverFetchCA } from "~/app/server";

export default async function Page({ 
  params: { ca }, 
}: { 
  params: { ca: string }, 
}) {
  const clanker = await getOrScrapeByCa(ca)
  const data = await serverFetchCA(ca)
  if (!data) {
    return <div>Not found</div>
  }

  return (
    <div>
      <Nav refreshing={false} view="detail"/>
      <TradeApp clanker={data} />
    </div>
  )
}