import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // 1. Verify the OpenID response with Steam (never trust raw params)
  const verifyParams = new URLSearchParams(searchParams);
  verifyParams.set("openid.mode", "check_authentication");

  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const verifyText = await verifyRes.text();
  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.redirect(`${origin}/auth?error=steam_failed`);
  }

  // 2. Extract SteamID from claimed_id (…/openid/id/7656119…)
  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const steamId = claimedId.split("/").pop();
  if (!steamId) return NextResponse.redirect(`${origin}/auth?error=no_steamid`);

  // 3. Fetch Steam profile (name, avatar)
  const profileRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  );
  const profileJson = await profileRes.json();
  const player = profileJson?.response?.players?.[0] ?? {};
  const name = player.personaname ?? "Steam Player";
  const avatar = player.avatarfull ?? null;

  // 4. Create or find the Supabase auth user (placeholder email)
  const admin = createAdminClient();
  const email = `${steamId}@steam.local`;
  const password = `steam_${steamId}_${process.env.STEAM_SECRET_SALT}`; // deterministic, server-only

  // Find existing auth user — or create one — so we always have the auth id
  const { data: list } = await admin.auth.admin.listUsers();
  let authUser = list?.users.find((u) => u.email === email);

  if (!authUser) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, avatar_url: avatar, steam_id: steamId },
    });
    if (error) {
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
    }
    authUser = created.user;
  }

  // 5. Ensure a Users row exists — seed it ONLY on first login, so returning
  //    logins never clobber the real email (or profile edits) the user saved.
  const { data: existingRow } = await admin
    .from("Users")
    .select("player_email")
    .eq("auth_id", authUser!.id)
    .maybeSingle();

  if (!existingRow) {
    const { error: insertError } = await admin.from("Users").insert({
      auth_id: authUser!.id,
      player_email: email,          // placeholder until they add a real one
      player_name: name,
      player_image: avatar,
      steam_id: steamId,
      auth_provider: "steam",
    });
    if (insertError) {
      return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(insertError.message)}`);
    }
  }

  // 6. Sign in via the SERVER client so cookies are written (setAll)
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return NextResponse.redirect(`${origin}/auth?error=session_failed`);
  }

  // 7. Still on the @steam.local placeholder → they must add a real email first
  const currentEmail = existingRow?.player_email ?? email;
  const hasRealEmail = !currentEmail.endsWith("@steam.local");
  return NextResponse.redirect(`${origin}${hasRealEmail ? "/" : "/profile/email"}`);
}