import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Who is calling an edge function: a trusted server (service role key) or a
// signed-in user. Returns null when the request carries neither.
export type Caller = { kind: "service" } | { kind: "user"; userId: string };

export async function getCaller(req: Request): Promise<Caller | null> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return { kind: "service" };

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { kind: "user", userId: data.user.id };
}

// A user may only act on their own data; the service role may act on anyone's.
export function mayActFor(caller: Caller | null, userId: string): boolean {
  if (!caller) return false;
  return caller.kind === "service" || caller.userId === userId;
}
