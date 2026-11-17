import { NextRequest, NextResponse } from "next/server";

import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let state = "cancelled";

  if (code && !request.nextUrl.searchParams.has("error")) {
    try {
      const client = await createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      state = error ? "failed" : "success";
    } catch {
      state = "failed";
    }
  }

  return NextResponse.redirect(new URL(`/?auth=${state}`, request.url));
}
