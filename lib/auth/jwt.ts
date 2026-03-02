import { jwtVerify,SignJWT } from "jose";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

import "server-only";

const getJwtSecret = () => new TextEncoder().encode(env.jwtSecret);
const getJwtIssuer = () => env.jwtIssuer;
const getJwtAudience = () => env.jwtAudience;
const getExpiresInSeconds = () => env.jwtExpiresIn;
const getCookieName = () => env.authCookieName;

export async function signSessionToken(userId: number) {
  const expiresIn = getExpiresInSeconds();
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setIssuer(getJwtIssuer())
    .setAudience(getJwtAudience())
    .setExpirationTime(`${expiresIn}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
  });

  const userId = Number.parseInt(payload.sub ?? "", 10);
  if (!Number.isFinite(userId)) {
    throw new Error("无效的会话信息");
  }

  return { userId };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: getCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getExpiresInSeconds(),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: getCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getCookieName())?.value;
  return token ?? "";
}
