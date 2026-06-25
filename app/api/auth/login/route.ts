import { NextResponse } from "next/server";
import { loginOrCreate } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !name) {
    return NextResponse.json(
      { error: "email and name are required" },
      { status: 400 }
    );
  }

  const profile = await loginOrCreate(email, name);

  const response = NextResponse.json(profile);
  response.cookies.set("session", profile._id, {
    httpOnly: true,
    path: "/",
    maxAge: 604800,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
