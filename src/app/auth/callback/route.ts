import type { NextRequest } from "next/server";
import { GET as confirm } from "../confirm/route";

export async function GET(request: NextRequest) {
  return confirm(request);
}
