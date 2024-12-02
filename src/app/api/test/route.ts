import { NextResponse } from 'next/server';
import { serverFetchHotClankers } from '~/app/server';

export async function GET(request: Request) {
  const res = await serverFetchHotClankers()
  return NextResponse.json(res);
}
