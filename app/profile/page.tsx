"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { getMyProfile, updateProfile, type ProfileForm } from "@/actions/profile";
import { listOrgs, createOrg, type Org } from "@/actions/event"; // adjust path if you put org actions elsewhere
import {
  Trophy, Gamepad2, Target, Clock, Calendar, MapPin, LogOut, Shield, Loader2, Save, Upload, Building2,
} from "lucide-react";

const GAMES = ["", "InvincibleVS", "2XKO", "Valorant", "Dead by Daylight"];
const REGIONS = ["", "NA", "EU", "APAC", "LATAM", "Global"];

const EMPTY: ProfileForm = {
  player_name: "", handle: "", game: "", region: "", player_image: "", org_id: null,
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [stats, setStats] = useState({ mmr: 0, winrate: 0, rank: "", hours: 0 });
  const [joined, setJoined] = useState("");
  const [email, setEmail] = useState("");
  const [authAvatar, setAuthAvatar] = useState("");

  // Org state
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", tricode: "", link: "", logo: "" });

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/auth");
        return;
      }
      setEmail(data.user.email ?? "");
      setAuthAvatar(data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || "");
      setJoined(new Date(data.user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }));

      const [orgRes, profRes] = await Promise.all([listOrgs(), getMyProfile()]);
      if (orgRes.data) setOrgs(orgRes.data);

      const p = profRes.data;
      if (p) {
        setForm({
          player_name: p.player_name ?? "",
          handle: p.handle ?? "",
          game: p.game ?? "",
          region: p.region ?? "",
          player_image: p.player_image ?? "",
          org_id: p.org_id ?? null,
        });
        setStats({ mmr: p.mmr ?? 0, winrate: p.win_rate ?? 0, rank: p.rank ?? "Unranked", hours: p.hours_played ?? 0 });
      }
      setLoading(false);
    });
  }, [router]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) { setUploadingAvatar(false); toast.error(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    update("player_image", data.publicUrl);
    setUploadingAvatar(false);
    toast.success("Image uploaded — Save to keep it");
  }

  async function handleNewOrgLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file);
    if (error) { setUploadingLogo(false); toast.error(error.message); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setNewOrg((s) => ({ ...s, logo: data.publicUrl }));
    setUploadingLogo(false);
  }

  async function handleSave() {
    setSaving(true);

    let orgId = form.org_id;

    // Creating a new org first, then linking to it
    if (creatingOrg) {
      if (!newOrg.name.trim()) { setSaving(false); toast.error("Enter an org name"); return; }
      const r = await createOrg({
        name: newOrg.name, tricode: newOrg.tricode, link: newOrg.link, logo: newOrg.logo,
      });
      if (r.error || !r.data) { setSaving(false); toast.error(r.error ?? "Couldn't create org"); return; }
      orgId = r.data.id;
      // add to local list & reset the create form
      setOrgs((prev) => (prev.some((o) => o.id === r.data!.id) ? prev : [...prev, r.data!]));
      setCreatingOrg(false);
      setNewOrg({ name: "", tricode: "", link: "", logo: "" });
      update("org_id", orgId);
    }

    const res = await updateProfile({ ...form, org_id: orgId });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else toast.success("Profile saved");
  }

  async function handleSignOut() {
    const supabase = createClient();    
    await supabase.auth.signOut();
    window.location.href = "/";          
  }

  if (loading) return <div className="p-10 text-muted-foreground">Loading profile…</div>;

  const displayName = form.player_name || form.handle || email.split("@")[0];
  const initial = (displayName[0] ?? "?").toUpperCase();
  const avatarSrc = form.player_image || authAvatar;
  const currentOrg = orgs.find((o) => o.id === form.org_id) ?? null;

  const statCards = [
    { label: "MMR", value: stats.mmr.toLocaleString(), icon: Trophy },
    { label: "Rank", value: stats.rank || "Unranked", icon: Shield },
    { label: "Win Rate", value: `${stats.winrate}%`, icon: Target },
    { label: "Hours", value: stats.hours.toLocaleString(), icon: Clock },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Banner */}
      <div className="relative h-40 md:h-52 rounded-3xl overflow-hidden border border-border bg-gradient-brand-soft">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(215,21,92,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(140,14,61,0.4),transparent_60%)]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-14 px-2 md:px-6">
        <div className="relative">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="size-28 md:size-32 rounded-2xl object-cover shadow-glow ring-4 ring-background" />
          ) : (
            <div className="size-28 md:size-32 rounded-2xl bg-gradient-brand grid place-items-center text-white font-bold text-4xl shadow-glow ring-4 ring-background">
              {initial}
            </div>
          )}
          <span className="absolute bottom-1 right-1 size-4 rounded-full bg-green-500 border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{displayName}</h1>
            {stats.rank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-brand text-white text-[11px] font-bold">
                <Shield className="size-3" /> {stats.rank.toUpperCase()}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
            <span>{form.handle ? `@${form.handle}` : email}</span>
            {form.region && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {form.region}</span>}
            {currentOrg && (
              <span className="inline-flex items-center gap-1">
                {currentOrg.logo ? <img src={currentOrg.logo} alt="" className="size-4 rounded" /> : <Building2 className="size-3.5" />}
                {currentOrg.tricode || currentOrg.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> Joined {joined}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSignOut} className="inline-flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-sm hover:bg-secondary/40">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{s.label}</span>
              <s.icon className="size-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gradient-brand">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Editable details */}
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-border mb-5">
          <Gamepad2 className="size-5 text-primary" />
          <h2 className="text-xl font-bold">Profile Details</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Display Name">
            <Input value={form.player_name} onChange={(v) => update("player_name", v)} placeholder="Your name" />
          </Field>
          <Field label="Handle" hint="Your @username">
            <Input value={form.handle} onChange={(v) => update("handle", v)} placeholder="e.g. phantom_100" />
          </Field>

          <Field label="Main Game">
            <Select value={form.game} onChange={(v) => update("game", v)} options={GAMES} placeholder="Select a game" />
          </Field>
          <Field label="Region">
            <Select value={form.region} onChange={(v) => update("region", v)} options={REGIONS} placeholder="Select a region" />
          </Field>

          {/* Organization: pick existing or create new */}
          <Field label="Organization" hint="Pick your org, or create a new one">
            <select
              value={creatingOrg ? "__create__" : (form.org_id ? String(form.org_id) : "")}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__create__") { setCreatingOrg(true); update("org_id", null); }
                else if (v === "") { setCreatingOrg(false); update("org_id", null); }
                else { setCreatingOrg(false); update("org_id", Number(v)); }
              }}
              className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
            >
              <option value="">No organization</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}{o.tricode ? ` (${o.tricode})` : ""}</option>
              ))}
              <option value="__create__">+ Create new org</option>
            </select>
          </Field>

          {/* Selected existing org preview */}
          <Field label="Selected Org">
            {creatingOrg ? (
              <p className="text-sm text-muted-foreground py-2.5">Creating a new org below…</p>
            ) : currentOrg ? (
              <div className="flex items-center gap-2 py-2">
                {currentOrg.logo
                  ? <img src={currentOrg.logo} alt="" className="size-8 rounded bg-secondary" />
                  : <div className="size-8 rounded bg-secondary grid place-items-center"><Building2 className="size-4 text-muted-foreground" /></div>}
                <span className="text-sm font-semibold">{currentOrg.name}{currentOrg.tricode ? ` · ${currentOrg.tricode}` : ""}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2.5">No org selected</p>
            )}
          </Field>

          {/* Create-new-org fields */}
          {creatingOrg && (
            <div className="md:col-span-2 grid md:grid-cols-2 gap-5 rounded-xl border border-dashed border-border p-4">
              <Field label="Org Name">
                <Input value={newOrg.name} onChange={(v) => setNewOrg((s) => ({ ...s, name: v }))} placeholder="e.g. Sentinels" />
              </Field>
              <Field label="Org Tricode">
                <Input value={newOrg.tricode} onChange={(v) => setNewOrg((s) => ({ ...s, tricode: v }))} placeholder="e.g. SEN" />
              </Field>
              <Field label="Org Link">
                <Input value={newOrg.link} onChange={(v) => setNewOrg((s) => ({ ...s, link: v }))} placeholder="https://..." />
              </Field>
              <Field label="Org Logo" hint="Uploaded once for this org">
                <div className="flex items-center gap-3">
                  {newOrg.logo
                    ? <img src={newOrg.logo} alt="" className="size-12 rounded-lg object-cover bg-secondary shrink-0" />
                    : <div className="size-12 rounded-lg bg-secondary grid place-items-center text-muted-foreground text-[10px] shrink-0">Logo</div>}
                  <label className="flex-1 flex items-center gap-2 bg-secondary/60 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-brand transition">
                    <Upload className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
                    <input type="file" accept="image/*" onChange={handleNewOrgLogo} className="hidden" disabled={uploadingLogo} />
                  </label>
                </div>
              </Field>
            </div>
          )}

          {/* Profile image */}
          <Field label="Profile Image" hint="Upload a photo — otherwise your account image is used">
            <div className="flex items-center gap-3">
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="size-12 rounded-lg object-cover bg-secondary shrink-0" />
                : <div className="size-12 rounded-lg bg-gradient-brand grid place-items-center text-white font-bold shrink-0">{initial}</div>}
              <label className="flex-1 flex items-center gap-2 bg-secondary/60 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-brand transition">
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">{uploadingAvatar ? "Uploading..." : "Upload new image"}</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>
          </Field>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold px-5 py-2.5 rounded-lg shadow-glow hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand placeholder:text-muted-foreground"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o === "" ? placeholder : o}</option>
      ))}
    </select>
  );
}