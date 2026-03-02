/**import { safeJson, encryptedResponse } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api") + "/dramabox";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return encryptedResponse([]);
  }

  try {
    const response = await fetch(
      `${UPSTREAM_API}/search?query=${encodeURIComponent(query)}`,
      { cache: 'no-store',}
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const data = await safeJson(response);
    return encryptedResponse(data);
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

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.sonzaix.indevs.in";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const q = searchParams.get("query"); // tetap pakai query dari frontend
  const result = searchParams.get("result") || "10";
  const page = searchParams.get("page") || "1";

  if (!q) {
    return encryptedResponse([]);
  }

  try {
    const response = await fetch(
      `${BASE_URL}/dramabox/search?q=${encodeURIComponent(q)}&result=${result}&page=${page}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: response.status }
      );
    }

    const apiResponse = await safeJson(response);

    // Kalau kamu cuma butuh data.books saja
    const data = apiResponse?.data ?? [];

    return encryptedResponse(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


