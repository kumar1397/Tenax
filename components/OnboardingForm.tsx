"use client";

import { useState, useTransition } from "react";
import { User, AtSign, Mail, MapPin, Building2, Upload, Loader2, Link2, Hash, Camera } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { completeOnboarding } from "@/actions/profile";
import { createOrg, type Org } from "@/actions/event";

const REGIONS = ["NA", "EU", "APAC", "LATAM", "Global"];

// Discord-style fallback: when the user skips uploading a picture we still
// assign a stable, generated avatar image so every player has a real photo.
const defaultAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || "Player")}`;

export default function OnboardingForm({
  orgs,
  defaultName,
  defaultImage,
  defaultEmail,
}: {
  orgs: Org[];
  defaultName: string;
  defaultImage: string;
  defaultEmail: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const [name, setName] = useState(defaultName);
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [region, setRegion] = useState("");
  const [avatar, setAvatar] = useState(defaultImage); // OAuth-provided picture, if any
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // "" = no org, "new" = create one, otherwise the chosen org id as a string
  const [orgChoice, setOrgChoice] = useState("");
  const [newOrg, setNewOrg] = useState({ name: "", tricode: "", link: "", logo: "" });
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) { setUploadingAvatar(false); setMsg("Error: " + error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatar(data.publicUrl);
    setUploadingAvatar(false);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file);
    if (error) { setUploading(false); setMsg("Error: " + error.message); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setNewOrg((s) => ({ ...s, logo: data.publicUrl }));
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setMsg("Error: Enter your name."); return; }
    if (!handle.trim()) { setMsg("Error: Pick a handle."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setMsg("Error: Enter a valid email."); return; }
    if (orgChoice === "new" && !newOrg.name.trim()) {
      setMsg("Error: Enter an organization name, or choose “No organization”.");
      return;
    }
    setMsg("");

    start(async () => {
      let orgId: number | null = null;

      if (orgChoice === "new") {
        const r = await createOrg({
          name: newOrg.name,
          tricode: newOrg.tricode,
          link: newOrg.link,
          logo: newOrg.logo,
        });
        if (r.error || !r.data) { setMsg("Error: " + (r.error ?? "Couldn't create org")); return; }
        orgId = r.data.id;
      } else if (orgChoice) {
        orgId = Number(orgChoice);
      }

      const res = await completeOnboarding({
        player_name: name.trim(),
        handle: handle.trim(),
        email: email.trim(),
        region,
        // Uploaded/OAuth picture, or a generated default if they skipped it
        player_image: avatar || defaultAvatar(handle.trim() || name.trim()),
        org_id: orgId,
      });
      if (res?.error) { setMsg("Error: " + res.error); return; }
      // Hard navigation so the middleware re-evaluates the gate with the
      // now-saved handle and lands the user on the home page.
      window.location.assign("/");
    });
  }

  const field = "w-full pl-10 pr-3 py-3 rounded-xl bg-secondary/60 border border-border focus:border-brand focus:outline-none text-sm";

  return (
    <div className="max-w-lg mx-auto p-6 mt-10 mb-16">
      <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-card-soft">
        <div className="mb-4 flex flex-col items-center">
          <label className="group relative block size-24 cursor-pointer">
            {avatar ? (
              <img src={avatar} alt="" className="size-full rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="grid size-full place-items-center rounded-full bg-gradient-brand text-3xl font-bold text-white ring-2 ring-border">
                {(name.trim()[0] || handle.trim()[0] || "?").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
              {uploadingAvatar ? <Loader2 className="size-5 animate-spin text-white" /> : <Camera className="size-5 text-white" />}
            </div>
            <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploadingAvatar} />
          </label>
          <span className="mt-2 text-[11px] text-muted-foreground">Tap to add a photo — optional, we&apos;ll pick one if you skip</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Set up your profile</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Welcome to Tenax — tell us a bit about yourself to get started.
        </p>

        <form onSubmit={submit} className="space-y-3">
          {/* Name */}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Display name</span>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />
            </div>
          </label>

          {/* Handle */}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Handle</span>
            <div className="relative mt-1">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input value={handle} onChange={(e) => setHandle(e.target.value.replace(/\s+/g, ""))} placeholder="yourhandle" className={field} />
            </div>
          </label>

          {/* Email — Steam gives none and some Discord accounts have none */}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
            </div>
          </label>

          {/* Region */}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Region</span>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={field + " appearance-none"}>
                <option value="">Select a region</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </label>

          {/* Organization */}
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Organization</span>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <select value={orgChoice} onChange={(e) => setOrgChoice(e.target.value)} className={field + " appearance-none"}>
                <option value="">No organization</option>
                {orgs.map((o) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                <option value="new">+ Create a new organization</option>
              </select>
            </div>
          </label>

          {/* Create-org fields */}
          {orgChoice === "new" && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input value={newOrg.name} onChange={(e) => setNewOrg((s) => ({ ...s, name: e.target.value }))} placeholder="Organization name" className={field} />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input value={newOrg.tricode} onChange={(e) => setNewOrg((s) => ({ ...s, tricode: e.target.value.toUpperCase().slice(0, 4) }))} placeholder="Tricode (e.g. TSM)" className={field} />
              </div>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input value={newOrg.link} onChange={(e) => setNewOrg((s) => ({ ...s, link: e.target.value }))} placeholder="Website or social link" className={field} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-semibold hover:border-brand transition">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Logo
                </span>
                {newOrg.logo && <img src={newOrg.logo} alt="" className="size-9 rounded-lg object-cover" />}
                <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || uploading || uploadingAvatar}
            className="w-full py-3 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:scale-[1.01] transition disabled:opacity-60 inline-flex items-center justify-center gap-2 mt-2"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Finish setup
          </button>
        </form>

        {msg && <p className={`mt-3 text-sm text-center ${msg.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{msg}</p>}
      </div>
    </div>
  );
}
