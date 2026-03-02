import React, { useState, useMemo } from "react";
import "./TrackLibrary.css";

/**
 * TrackLibrary — VDJ-style bottom-panel track browser
 * with a file tree sidebar and track list table.
 */

export interface TrackItem {
  title: string;
  artist: string;
  remix?: string;
  key: string;
  bpm: number;
  length: string;
  rating: number; // 0-5
}

const DEMO_TRACKS: TrackItem[] = [
  {
    title: "Sweet Dreams (Radio Edit)",
    artist: "DGN Radio",
    remix: "Original Mix",
    key: "04A",
    bpm: 126.0,
    length: "03:42",
    rating: 5,
  },
  {
    title: "No Stress (Extended Mix)",
    artist: "DGN Collective",
    key: "02A",
    bpm: 126.0,
    length: "04:18",
    rating: 4,
  },
  {
    title: "Rise Up",
    artist: "Kiss House ONE",
    remix: "No Hopes Remix",
    key: "05B",
    bpm: 118.0,
    length: "04:14",
    rating: 4,
  },
  {
    title: "Take On Me",
    artist: "a-ha",
    remix: "Retniw Extended Remix",
    key: "11B",
    bpm: 115.0,
    length: "03:42",
    rating: 3,
  },
  {
    title: "All We Got (Radio Edit)",
    artist: "Robin Schulz Ft. Kiddo",
    remix: "Leo Burn Radio Edit",
    key: "01A",
    bpm: 118.0,
    length: "02:28",
    rating: 5,
  },
  {
    title: "In Da Club",
    artist: "50 Cent",
    remix: "Imanbek Remix",
    key: "11B",
    bpm: 120.0,
    length: "02:06",
    rating: 4,
  },
  {
    title: "Candy Shop",
    artist: "50 Cent feat. Olivia",
    remix: "N&Joy Remix",
    key: "11A",
    bpm: 120.0,
    length: "03:33",
    rating: 5,
  },
  {
    title: "Wonderful Life",
    artist: "Black",
    remix: "Dj Onion Remix",
    key: "08A",
    bpm: 120.0,
    length: "04:36",
    rating: 3,
  },
  {
    title: "Da Funk",
    artist: "Daft Punk",
    remix: "Space Food Edit",
    key: "09B",
    bpm: 120.0,
    length: "05:56",
    rating: 4,
  },
  {
    title: "Party On My Own",
    artist: "Alok & Vintage Culture",
    remix: "VIP Extended Mix",
    key: "09A",
    bpm: 124.0,
    length: "04:03",
    rating: 5,
  },
  {
    title: "Satisfaction",
    artist: "Benny Benassi",
    remix: "TWISTERZ Remix",
    key: "07B",
    bpm: 125.0,
    length: "03:47",
    rating: 5,
  },
  {
    title: "Dreams (Radio Edit)",
    artist: "2 Brothers On The 4th Floor",
    remix: "Dr.Luxe & Cheeful",
    key: "04A",
    bpm: 126.0,
    length: "02:31",
    rating: 4,
  },
];

const FOLDERS = [
  {
    icon: "🎵",
    name: "Local Music",
    children: ["House Music", "Hot Selection", "CHART", "Essentials"],
  },
  { icon: "🌐", name: "CloudDrive", children: [] },
  { icon: "🟩", name: "TIDAL", children: [] },
  { icon: "🟠", name: "Beatport", children: [] },
  { icon: "☁️", name: "SoundCloud", children: [] },
  {
    icon: "📋",
    name: "My Lists",
    children: ["Hot Selection", "Viral Hits", "Club Tracks"],
  },
  { icon: "🕐", name: "History", children: [] },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="tl-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "star-filled" : "star-empty"}>
          ★
        </span>
      ))}
    </span>
  );
}

export const TrackLibrary: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("Local Music");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["Local Music", "My Lists"]),
  );
  const [sortCol, setSortCol] = useState<keyof TrackItem>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredTracks = useMemo(() => {
    let out = DEMO_TRACKS;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.remix && t.remix.toLowerCase().includes(q)),
      );
    }
    out = [...out].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return out;
  }, [search, sortCol, sortDir]);

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSort = (col: keyof TrackItem) => {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  return (
    <div className="track-library" role="region" aria-label="Track Library">
      {/* Sidebar */}
      <div className="tl-sidebar">
        {FOLDERS.map((f) => (
          <div key={f.name}>
            <button
              className={`tl-folder-btn ${selectedFolder === f.name ? "tl-folder-active" : ""}`}
              onClick={() => {
                setSelectedFolder(f.name);
                if (f.children.length) toggleFolder(f.name);
              }}
            >
              <span className="tl-folder-icon">{f.icon}</span>
              <span>{f.name}</span>
              {f.children.length > 0 && (
                <span className="tl-expand">
                  {expandedFolders.has(f.name) ? "▾" : "▸"}
                </span>
              )}
            </button>
            {f.children.length > 0 && expandedFolders.has(f.name) && (
              <div className="tl-subfolder-list">
                {f.children.map((c) => (
                  <button
                    key={c}
                    className="tl-subfolder-btn"
                    onClick={() => setSelectedFolder(c)}
                  >
                    <span className="tl-sub-icon">📂</span> {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Track table */}
      <div className="tl-main">
        {/* Search bar */}
        <div className="tl-search-bar">
          <span className="tl-search-icon">🔍</span>
          <input
            type="text"
            className="tl-search-input"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="tl-file-count">{filteredTracks.length} files</span>
        </div>

        {/* Table */}
        <div className="tl-table-wrap">
          <table className="tl-table">
            <thead>
              <tr>
                <th className="tl-th" onClick={() => handleSort("title")}>
                  Title {sortCol === "title" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="tl-th" onClick={() => handleSort("artist")}>
                  Artist{" "}
                  {sortCol === "artist" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="tl-th">Remix</th>
                <th
                  className="tl-th tl-th-center"
                  onClick={() => handleSort("key")}
                >
                  Key
                </th>
                <th
                  className="tl-th tl-th-center"
                  onClick={() => handleSort("bpm")}
                >
                  BPM
                </th>
                <th
                  className="tl-th tl-th-center"
                  onClick={() => handleSort("length")}
                >
                  Length
                </th>
                <th
                  className="tl-th tl-th-center"
                  onClick={() => handleSort("rating")}
                >
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((t, i) => (
                <tr key={i} className="tl-row">
                  <td className="tl-td tl-td-title">🎵 {t.title}</td>
                  <td className="tl-td">{t.artist}</td>
                  <td className="tl-td tl-td-remix">{t.remix || ""}</td>
                  <td className="tl-td tl-td-center">
                    <span
                      className={`tl-key-tag ${t.key.includes("A") ? "key-major" : "key-minor"}`}
                    >
                      {t.key}
                    </span>
                  </td>
                  <td className="tl-td tl-td-center tl-td-mono">
                    {t.bpm.toFixed(1)}
                  </td>
                  <td className="tl-td tl-td-center tl-td-mono">{t.length}</td>
                  <td className="tl-td tl-td-center">
                    <StarRating rating={t.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrackLibrary;
