import { Sparkles, Handshake, Award } from "lucide-react";

const sponsors = [
    { name: "Acme", src: "/one.png" },
    { name: "Nova", src: "/two.png" },
    { name: "Pulse", src: "/three.png" }
];

export default function About() {
    return (
        <>
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur p-8 md:p-12 mx-4">
                {/* soft crimson glow accent */}
                <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-brand-soft blur-3xl opacity-60" />

                <div className="relative max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Sparkles className="size-3.5 text-primary" /> Who We Are
                    </div>

                    <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
                        Turning competition into <span className="text-gradient-brand">opportunity</span>
                    </h2>

                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        Tenax, founded in 2022 and named for the Latin word meaning “tenacious,” is an online tournament provider offering full-service production across multiple esports titles. Built to expand opportunities for underprivileged and underrepresented communities, Tenax uses tournaments as the foundation for helping players and creators grow. By focusing on high-quality, sustainable events, we provide clear competitive pathways, support career development, and offer accessible experiences for both aspiring professionals and casual gamers.
                    </p>
                </div>
            </section>

            <section>
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mt-12 rounded-full bg-secondary border border-border text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Award className="size-3.5 text-primary" /> Our Achievements
                    </div>
                    <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
                        Numbers that <span className="text-gradient-brand">tell our story</span>
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mx-4">
                    <MiniStat label="Game Titles" value="6" />
                    <MiniStat label="Players" value="52K" />
                    <MiniStat label="Prize Pool" value="$10,000+" />
                    <MiniStat label="Impressions" value="1M+" />
                    <MiniStat label="Watch Hours" value="500+" />
                    <MiniStat label="Players Served" value="2,000+" />
                </div>
            </section>

            {/* Sponsors */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur mt-8 mx-4 p-8 md:p-12">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <Handshake className="size-3.5 text-primary" /> Our Sponsors
                    </div>
                    <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
                        Backed by the <span className="text-gradient-brand">best in the game</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        Proud to partner with brands that share our mission of growing competitive esports.
                    </p>
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                    {sponsors.map((s) => (
                        <div
                            key={s.name}
                            className="group flex items-center justify-center rounded-2xl border border-border bg-secondary/40 p-6 w-40 aspect-[3/2] hover:border-brand transition"
                        >
                            <img
                                src={s.src}
                                alt={s.name}
                                className="max-h-16 max-w-full w-auto object-contain"
                            />
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:border-brand transition flex flex-col items-center justify-center">
            <div className="mt-3 text-2xl font-bold">{value}</div>
            <div className="text-lg font-bold text-gradient-brand">{label}</div>
        </div>
    );
}