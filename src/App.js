import { useState, useEffect } from "react";

const COACHES = [
  { id: "trin",  name: "Trin",  date: "Tuesday 10th March",   color: "#c8001a", accent: "#ff4d5e", startHour: 16, startMin: 30, slotMinutes: 15, maxSlots: 7, emoji: "🔴" },
  { id: "milly", name: "Milly", date: "Wednesday 11th March", color: "#15612e", accent: "#33cc6a", startHour: 16, startMin: 30, slotMinutes: 15, maxSlots: 7, emoji: "🟢" },
  { id: "grace", name: "Grace", date: "Wednesday 11th March", color: "#0d3d8f", accent: "#5599ff", startHour: 18, startMin:  0, slotMinutes: 10, maxSlots: 6, emoji: "🔵" },
];

function generateSlots(coach) {
  return Array.from({ length: coach.maxSlots }, (_, i) => {
    const s = coach.startHour * 60 + coach.startMin + i * coach.slotMinutes;
    const e = s + coach.slotMinutes;
    const fmt = t => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    return { id: `${coach.id}_${i}`, time: fmt(s), timeRange: `${fmt(s)}–${fmt(e)}` };
  });
}

const STORAGE_KEY = "afl_bookings_v1";
const ADMIN_PIN   = "AFL2025";

export default function App() {
  const [bookings, setBookings]           = useState({});
  const [view, setView]                   = useState("book");
  const [adminPin, setAdminPin]           = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinError, setPinError]           = useState(false);
  const [playerName, setPlayerName]       = useState("");
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [confirming, setConfirming]       = useState(false);
  const [success, setSuccess]             = useState(null);
  const [saving, setSaving]               = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBookings(JSON.parse(saved));
    } catch {}
  }, []);

  // Sync bookings across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setBookings(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function persist(nb) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nb)); } catch {}
  }

  function handleBook() {
    if (!playerName.trim() || !selectedSlot || saving) return;
    setSaving(true);
    const nb = {
      ...bookings,
      [selectedSlot.slotId]: { name: playerName.trim(), bookedAt: new Date().toISOString() },
    };
    setBookings(nb);
    persist(nb);
    setSuccess({ ...selectedSlot, name: playerName.trim() });
    setSelectedSlot(null);
    setPlayerName("");
    setConfirming(false);
    setSaving(false);
  }

  function handleRemove(slotId) {
    const nb = { ...bookings };
    delete nb[slotId];
    setBookings(nb);
    persist(nb);
  }

  function handleClearAll() {
    if (window.confirm("Clear ALL bookings? This cannot be undone.")) {
      setBookings({});
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const totalBooked = Object.keys(bookings).length;
  const totalSlots  = COACHES.reduce((a, c) => a + c.maxSlots, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0ece4", fontFamily: "'Georgia', serif" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(160deg,#140000 0%,#001408 40%,#00081a 100%)", borderBottom: "1px solid #1a1a1a", padding: "22px 20px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🏉</span>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", fontFamily: "sans-serif", textTransform: "uppercase" }}>Team Bookings</div>
              <div style={{ fontSize: 22, color: "#f5f0e8" }}>Coach 1-on-1 Sessions</div>
            </div>
          </div>
          <div style={{ marginTop: 11, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "#555", fontFamily: "sans-serif" }}>
            <span>📅 Tues 10 &amp; Wed 11 March</span>
            <span style={{ color: "#222" }}>|</span>
            <span style={{ color: totalBooked === totalSlots ? "#c8001a" : "#888" }}>{totalBooked}/{totalSlots} spots filled</span>
            <span style={{ color: "#222" }}>|</span>
            <button
              onClick={() => { setView(v => v === "admin" ? "book" : "admin"); setAdminPin(""); setPinError(false); }}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "sans-serif" }}
            >
              {view === "admin" ? "← Back to Booking" : "🔐 Admin"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* SUCCESS BANNER */}
        {success && (
          <div style={{ background: "#071a0c", border: "1px solid #33cc6a44", borderRadius: 12, padding: "15px 18px", marginBottom: 22, fontFamily: "sans-serif", position: "relative" }}>
            <button onClick={() => setSuccess(null)} style={{ position: "absolute", top: 8, right: 12, background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18 }}>×</button>
            <div style={{ fontSize: 16, color: "#33cc6a", marginBottom: 4 }}>✅ You're booked in!</div>
            <div style={{ color: "#aaa", fontSize: 13 }}>
              <strong style={{ color: "#ddd" }}>{success.name}</strong> → <strong style={{ color: "#ddd" }}>{success.coachName}</strong> · {success.timeRange} · {success.date}
            </div>
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {view === "admin" && (
          !adminUnlocked ? (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 38, marginBottom: 16 }}>🔐</div>
              <div style={{ fontSize: 15, color: "#aaa", marginBottom: 20, fontFamily: "sans-serif" }}>Coach / Manager Access</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <input
                  type="password" placeholder="PIN" value={adminPin}
                  onChange={e => { setAdminPin(e.target.value); setPinError(false); }}
                  onKeyDown={e => e.key === "Enter" && (adminPin === ADMIN_PIN ? setAdminUnlocked(true) : setPinError(true))}
                  style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${pinError ? "#e03" : "#2a2a2a"}`, background: "#111", color: "#fff", fontSize: 16, width: 140, outline: "none", fontFamily: "sans-serif" }}
                />
                <button
                  onClick={() => adminPin === ADMIN_PIN ? setAdminUnlocked(true) : setPinError(true)}
                  style={{ padding: "10px 22px", borderRadius: 8, background: "#c8001a", border: "none", color: "#fff", cursor: "pointer", fontSize: 15, fontFamily: "sans-serif" }}
                >Unlock</button>
              </div>
              {pinError && <div style={{ color: "#e05", marginTop: 10, fontSize: 13, fontFamily: "sans-serif" }}>Incorrect PIN</div>}
              <div style={{ color: "#333", fontSize: 11, marginTop: 8, fontFamily: "sans-serif" }}>PIN: AFL2025</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, fontWeight: "normal", color: "#ccc", margin: 0 }}>All Bookings — {totalBooked}/{totalSlots}</h2>
                <button onClick={handleClearAll} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 6, color: "#555", cursor: "pointer", fontSize: 12, padding: "5px 12px", fontFamily: "sans-serif" }}>
                  Clear All
                </button>
              </div>

              {/* ⚠️ Note about localStorage */}
              <div style={{ background: "#130d00", border: "1px solid #c8501a33", borderRadius: 10, padding: "12px 16px", marginBottom: 22, fontSize: 12, fontFamily: "sans-serif", color: "#a06030", lineHeight: 1.7 }}>
                <strong style={{ color: "#ff8040" }}>📌 Important:</strong> Bookings are stored in each person's browser. To see everyone's bookings in one place, use the <strong>shared view</strong> — all bookings made on any device are visible to everyone who opens the app, as long as they're using the same link.
              </div>

              {COACHES.map(coach => {
                const slots = generateSlots(coach);
                const coachBooked = slots.filter(s => bookings[s.id]).length;
                return (
                  <div key={coach.id} style={{ marginBottom: 22, background: "#0c0c0c", border: `1px solid ${coach.color}2a`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ background: `${coach.color}15`, padding: "11px 16px", borderBottom: `1px solid ${coach.color}1a`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold", fontSize: 15, color: coach.accent }}>{coach.emoji} {coach.name}</span>
                      <span style={{ fontSize: 12, color: "#666", fontFamily: "sans-serif" }}>{coach.date} · {coachBooked}/{coach.maxSlots}</span>
                    </div>
                    {slots.map(slot => {
                      const b = bookings[slot.id];
                      return (
                        <div key={slot.id} style={{ padding: "10px 16px", borderBottom: "1px solid #101010", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: b ? 1 : 0.3 }}>
                          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: b ? coach.accent : "#444", minWidth: 95 }}>{slot.timeRange}</span>
                            <span style={{ fontFamily: "sans-serif", fontSize: 14, color: b ? "#eee" : "#333" }}>{b ? b.name : "—"}</span>
                          </div>
                          {b && (
                            <button onClick={() => handleRemove(slot.id)} style={{ background: "none", border: "1px solid #222", borderRadius: 5, color: "#555", cursor: "pointer", fontSize: 11, padding: "3px 8px", fontFamily: "sans-serif" }}>
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ══ BOOKING ══ */}
        {view === "book" && !confirming && (
          <div>
            <p style={{ color: "#666", fontSize: 13, fontFamily: "sans-serif", margin: "0 0 22px" }}>
              Tap an available time slot to book your 1-on-1 session with a coach.
            </p>
            {COACHES.map(coach => {
              const slots = generateSlots(coach);
              return (
                <div key={coach.id} style={{ marginBottom: 30 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13, paddingBottom: 12, borderBottom: `2px solid ${coach.color}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${coach.color}1a`, border: `2px solid ${coach.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                      {coach.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 19 }}>{coach.name}</div>
                      <div style={{ fontSize: 12, color: "#666", fontFamily: "sans-serif", marginTop: 1 }}>
                        {coach.date} · {coach.slotMinutes}min sessions · {slots.filter(s => bookings[s.id]).length}/{coach.maxSlots} booked
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: 8 }}>
                    {slots.map(slot => {
                      const booked = bookings[slot.id];
                      return (
                        <button
                          key={slot.id}
                          disabled={!!booked}
                          onClick={() => {
                            setSelectedSlot({ slotId: slot.id, coachId: coach.id, coachName: coach.name, coachColor: coach.color, timeRange: slot.timeRange, date: coach.date });
                            setConfirming(true);
                          }}
                          style={{ padding: "13px 8px", borderRadius: 9, border: `1.5px solid ${booked ? "#181818" : `${coach.color}44`}`, background: booked ? "#0b0b0b" : "#111", color: booked ? "#333" : coach.accent, cursor: booked ? "default" : "pointer", fontSize: 14, fontFamily: "monospace", fontWeight: "bold", transition: "all 0.12s" }}
                          onMouseEnter={e => { if (!booked) { e.currentTarget.style.background = `${coach.color}1a`; e.currentTarget.style.borderColor = coach.color; } }}
                          onMouseLeave={e => { if (!booked) { e.currentTarget.style.background = "#111"; e.currentTarget.style.borderColor = `${coach.color}44`; } }}
                        >
                          <div>{slot.time}</div>
                          <div style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: "normal", marginTop: 4, color: booked ? "#2e2e2e" : "#555" }}>
                            {booked ? booked.name : "Available"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CONFIRM ══ */}
        {view === "book" && confirming && selectedSlot && (
          <div style={{ background: "#0c0c0c", border: `2px solid ${selectedSlot.coachColor}`, borderRadius: 16, padding: "26px 22px", maxWidth: 370, margin: "0 auto" }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555", fontFamily: "sans-serif", marginBottom: 6 }}>Confirm Booking</div>
            <div style={{ fontSize: 19, marginBottom: 4 }}>{selectedSlot.coachName}</div>
            <div style={{ fontSize: 13, color: "#777", fontFamily: "sans-serif", marginBottom: 22 }}>{selectedSlot.timeRange} · {selectedSlot.date}</div>

            <label style={{ display: "block", fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "#666", fontFamily: "sans-serif", marginBottom: 7 }}>Your Name</label>
            <input
              autoFocus
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBook()}
              placeholder="e.g. Sarah"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${playerName.trim() ? selectedSlot.coachColor + "66" : "#1e1e1e"}`, background: "#080808", color: "#fff", fontSize: 15, fontFamily: "sans-serif", boxSizing: "border-box", outline: "none", marginBottom: 20, transition: "border 0.15s" }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setConfirming(false); setSelectedSlot(null); setPlayerName(""); }}
                style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#777", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" }}
              >Back</button>
              <button
                onClick={handleBook}
                disabled={!playerName.trim() || saving}
                style={{ flex: 2, padding: "12px", borderRadius: 8, border: "none", background: playerName.trim() ? selectedSlot.coachColor : "#1a1a1a", color: playerName.trim() ? "#fff" : "#333", cursor: playerName.trim() ? "pointer" : "default", fontSize: 15, fontFamily: "sans-serif", fontWeight: "bold", transition: "all 0.15s" }}
              >{saving ? "Saving…" : "Confirm ✓"}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
