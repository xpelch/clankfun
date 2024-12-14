// Do not cache this page

// Set cache to 'no-store' to prevent Vercel from caching this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Nav, TradeApp } from "~/app/app";
import { getOrScrapeByCa } from "~/lib/clanker";
import { serverFetchCA } from "~/app/server";
import { track } from "@vercel/analytics/server";

type Params = Promise<{ ca: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  try {
    const { ca } = await params;
    await getOrScrapeByCa(ca);
    const data = await serverFetchCA(ca);

    if (!data) {
      return {
        title: "Token not found",
      };
    }

    track("View coin", {
      ca: data.contract_address,
    });

    return {
      title: `Trade ${data.name}`,
      description: `Trade ${data.name} on clank.fun`,
      openGraph: {
        images: [data.img_url ? data.img_url : 'https://clank.fun/og.png'],
      },
    };
  } catch (error) {
    console.error("Error in generateMetadata:", error);
    return {
      title: "Error loading token",
    };
  }
}

export default async function Page({ params }: { params: Params }) {
  try {
    const { ca } = await params;
    await getOrScrapeByCa(ca);
    const data = await serverFetchCA(ca);

    if (!data) {
      return <div>Not found</div>;
    }

    return (
      <div className="w-full h-full min-h-screen flex flex-col">
        <Nav refreshing={false} view="detail" />
        <div className="px-2 md:px-6 flex-grow">
          <TradeApp clanker={data} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Page component:", error);
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Error loading token</h1>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }
}
