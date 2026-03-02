/**import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/dramabox";

export async function GET() {
  try {
    const response = await fetch(`${UPSTREAM_API}/latest`, {
      cache: 'no-store',});

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const data = await safeJson(response);
    
    // Filter out items without bookId or bookName to prevent blank cards
    const filteredData = Array.isArray(data) 
      ? data.filter((item: any) => item && item.bookId) 
      : [];

    return encryptedResponse(filteredData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}**/

import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.sonzaix.indevs.in";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";

    const response = await fetch(
      `${BASE_URL}/dramabox/new?page=${page}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const apiResponse = await safeJson(response);

    // Ambil semua books dari data[]
    const books =
      apiResponse?.data?.flatMap((section: any) =>
        section?.books || []
      ) || [];

    // Hindari card kosong
    const filteredBooks = books.filter(
      (item: any) => item && item.drama_id && item.drama_name
    );

    return encryptedResponse(filteredBooks);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
