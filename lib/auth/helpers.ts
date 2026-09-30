import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./options";
import { redirect } from "next/navigation";

export async function getSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
