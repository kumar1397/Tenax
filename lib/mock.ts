export type Event = {
    id: string;
    title: string;
    game: string;
    region: string;
    format: string;
    prize: string;
    entry: string;
    startsAt: string;
    status: "Live" | "Upcoming" | "Registration" | "Ended";
    participants: number;
    capacity: number;
    organizer: string;
    cover: string;
    tags: string[];
  };
  
  const covers = [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=80",
    "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&q=80",
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=80",
    "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200&q=80",
    "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&q=80",
  ];
  
  const games = ["Valorant", "League of Legends", "CS2", "Fortnite", "Apex Legends", "Rocket League", "Dota 2", "Overwatch 2"];
  const regions = ["NA", "EU", "APAC", "LATAM", "Global"];
  const formats = ["Single Elim", "Double Elim", "Round Robin", "Swiss"];
  const statuses: Event["status"][] = ["Live", "Upcoming", "Registration", "Upcoming", "Registration", "Live"];
  
  export const events: Event[] = Array.from({ length: 18 }).map((_, i) => ({
    id: `evt-${i + 1}`,
    title: [
      "Crimson Clash Open", "Phantom Cup", "Apex Showdown", "Royale Series", "Iron Brawl",
      "Neon Nights Invitational", "Vanguard League", "Eclipse Championship", "Bloodmoon Bracket",
      "Velocity Open", "Echo Rumble", "Zero Hour Finals", "Onyx Trials", "Spectre Slam",
      "Reign Invitational", "Pulse Cup", "Ascend Open", "Inferno Gauntlet",
    ][i],
    game: games[i % games.length],
    region: regions[i % regions.length],
    format: formats[i % formats.length],
    prize: ["$10,000", "$25,000", "$5,000", "$50,000", "$2,500", "$100,000"][i % 6],
    entry: i % 3 === 0 ? "Free" : `$${(i % 4 + 1) * 5}`,
    startsAt: new Date(Date.now() + (i - 2) * 86400000).toISOString(),
    status: statuses[i % statuses.length],
    participants: 32 + i * 7,
    capacity: 128,
    organizer: ["CrimsonGG", "RiotEsports", "FaceIt", "ESL", "BLAST"][i % 5],
    cover: covers[i % covers.length],
    tags: ["Open", i % 2 ? "Solo" : "Team", "Ranked"],
  }));
  
  export type Player = {
    id: string;
    handle: string;
    name: string;
    rank: string;
    rp: number;
    winrate: number;
    game: string;
    region: string;
    avatar: string;
    status: "Online" | "In Match" | "Offline";
  };
  
  const handles = [
    "Phantom", "Zenith", "Volt", "Cinder", "Nyx", "Ronin", "Echo", "Rogue",
    "Specter", "Vex", "Inferno", "Glitch", "Karma", "Atlas", "Mirage", "Onyx",
    "Riot", "Nova", "Quake", "Surge",
  ];
  
  export const players: Player[] = handles.map((h, i) => ({
    id: `p-${i + 1}`,
    handle: h.toLowerCase() + "_" + (100 + i),
    name: h,
    rank: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Radiant"][i % 8],
    rp: 1000 + i * 137,
    winrate: 45 + (i * 3) % 40,
    game: games[i % games.length],
    region: regions[i % regions.length],
    avatar: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${h}&backgroundColor=8C0E3D,D7155C,1a0a14`,
    status: (["Online", "In Match", "Offline", "Online", "In Match"] as const)[i % 5],
  }));
  