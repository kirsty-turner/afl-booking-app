import { useState, useEffect } from "react";

const COACHES = [
  { id: "trin",  name: "Trin",  date: "Tuesday 10th March",   color: "#1a1a1a", accent: "#F5C800", startHour: 16, startMin: 30, slotMinutes: 15, maxSlots: 7,  initial: "T" },
  { id: "milly", name: "Milly", date: "Wednesday 11th March", color: "#2d2d2d", accent: "#F5C800", startHour: 16, startMin: 30, slotMinutes: 15, maxSlots: 7,  initial: "M" },
  { id: "grace", name: "Grace", date: "Wednesday 11th March", color: "#222222", accent: "#F5C800", startHour: 18, startMin:  0, slotMinutes: 10, maxSlots: 6,  initial: "G" },
];

function generateSlots(coach) {
  return Array.from({ length: coach.maxSlots }, (_, i) => {
    const s = coach.startHour * 60 + coach.startMin + i * coach.slotMinutes;
    const e = s + coach.slotMinutes;
    const fmt = t => {
      let h = Math.floor(t / 60), m = t % 60, ampm = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return h + ":" + String(m).padStart(2, "0") + ampm;
    };
    return { id: `${coach.id}_${i}`, time: fmt(s), timeRange: `${fmt(s)}–${fmt(e)}` };
  });
}

const STORAGE_KEY = "afl_bookings_v5";
const ADMIN_PIN = "AFL2025";

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBookings(JSON.parse(saved));
    } catch {}
  }, []);

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
    const nb = { ...bookings, [selectedSlot.slotId]: { name: playerName.trim(), bookedAt: new Date().toISOString() } };
    setBookings(nb); persist(nb);
    setSuccess({ ...selectedSlot, name: playerName.trim() });
    setSelectedSlot(null); setPlayerName(""); setConfirming(false); setSaving(false);
  }

  function handleRemove(slotId) {
    const nb = { ...bookings }; delete nb[slotId];
    setBookings(nb); persist(nb);
  }

  const totalBooked = Object.keys(bookings).length;
  const totalSlots  = COACHES.reduce((a, c) => a + c.maxSlots, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f5f0", fontFamily: "'Georgia', serif", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        * { box-sizing: border-box; }
        .slot-btn { transition: all 0.15s ease; }
        .slot-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245,200,0,0.2); border-color: #F5C800 !important; }
        .slot-btn:active:not(:disabled) { transform: translateY(0); }
        .fade-in { animation: fadeUp 0.4s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#1a1a1a", padding: "0 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -20, width: 260, height: "140%", background: "#F5C800", transform: "skewX(-10deg)", opacity: 0.06 }} />
        <div style={{ position: "absolute", right: 40, top: 0, width: 60, height: "100%", background: "#F5C800", transform: "skewX(-10deg)", opacity: 0.04 }} />
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "26px 0 22px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "#F5C800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🐯</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: "#fff", letterSpacing: 3, lineHeight: 1 }}>COACH SESSIONS</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#777", marginTop: 4, letterSpacing: 1.5 }}>BOOK YOUR 1-ON-1 · MARCH 2025</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "#F5C800", letterSpacing: 1 }}>
                  {totalBooked}<span style={{ color: "#444", fontSize: 18 }}>/{totalSlots}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#666", letterSpacing: 1 }}>SPOTS FILLED</div>
              </div>
              <button
                onClick={() => { setView(v => v === "admin" ? "book" : "admin"); setAdminPin(""); setPinError(false); setAdminUnlocked(false); }}
                style={{ background: view === "admin" ? "#F5C800" : "transparent", border: "1.5px solid #333", borderRadius: 8, color: view === "admin" ? "#1a1a1a" : "#666", cursor: "pointer", fontSize: 11, padding: "7px 14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: 1, transition: "all 0.15s" }}
              >{view === "admin" ? "← BACK" : "ADMIN"}</button>
            </div>
          </div>
          {/* Date pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            {[{ d: "TUE 10 MARCH", s: "Trin · 4:30–6pm" }, { d: "WED 11 MARCH", s: "Milly 4:30–6pm · Grace 6–7pm" }].map((x, i) => (
              <div key={i} style={{ background: "#242424", borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F5C800", flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "#F5C800", letterSpacing: 1 }}>{x.d}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#777" }}>{x.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "26px 16px 80px" }}>

        {/* SUCCESS */}
        {success && (
          <div className="fade-in" style={{ background: "#fff", border: "2px solid #F5C800", borderRadius: 14, padding: "16px 20px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-start", boxShadow: "0 4px 24px rgba(245,200,0,0.15)" }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: "#1a1a1a", marginBottom: 5 }}>🎉 YOU'RE BOOKED IN!</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#777" }}>
                <strong style={{ color: "#1a1a1a" }}>{success.name}</strong> → <strong style={{ color: "#1a1a1a" }}>{success.coachName}</strong> · {success.timeRange} · {success.date}
              </div>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 20, padding: "0 0 0 12px", flexShrink: 0 }}>×</button>
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {view === "admin" && (
          !adminUnlocked ? (
            <div className="fade-in" style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🔐</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 3, marginBottom: 6 }}>ADMIN ACCESS</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa", marginBottom: 28 }}>Coaches & managers only</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 280, margin: "0 auto" }}>
                <input type="password" placeholder="Enter PIN" value={adminPin}
                  onChange={e => { setAdminPin(e.target.value); setPinError(false); }}
                  onKeyDown={e => e.key === "Enter" && (adminPin === ADMIN_PIN ? setAdminUnlocked(true) : setPinError(true))}
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${pinError ? "#e05" : "#ddd"}`, background: "#fff", color: "#1a1a1a", fontSize: 15, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                />
                <button onClick={() => adminPin === ADMIN_PIN ? setAdminUnlocked(true) : setPinError(true)}
                  style={{ padding: "12px 20px", borderRadius: 10, background: "#1a1a1a", border: "none", color: "#F5C800", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                  GO
                </button>
              </div>
              {pinError && <div style={{ color: "#e05", marginTop: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Incorrect PIN — try again</div>}
            </div>
          ) : (
            <div className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 2 }}>
                  ALL BOOKINGS <span style={{ color: "#F5C800" }}>{totalBooked}/{totalSlots}</span>
                </div>
                <button onClick={() => { if (window.confirm("Clear ALL bookings? This cannot be undone.")) { setBookings({}); localStorage.removeItem(STORAGE_KEY); } }}
                  style={{ background: "none", border: "1.5px solid #e0e0e0", borderRadius: 8, color: "#bbb", cursor: "pointer", fontSize: 12, padding: "6px 12px", fontFamily: "'DM Sans', sans-serif" }}>
                  Clear All
                </button>
              </div>
              {COACHES.map(coach => {
                const slots = generateSlots(coach);
                const coachBooked = slots.filter(s => bookings[s.id]).length;
                return (
                  <div key={coach.id} style={{ marginBottom: 18, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ background: "#1a1a1a", padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#F5C800", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#1a1a1a" }}>{coach.initial}</div>
                        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "#fff", letterSpacing: 1.5 }}>{coach.name}</span>
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#777" }}>{coach.date} · {coachBooked}/{coach.maxSlots}</span>
                    </div>
                    {slots.map(slot => {
                      const b = bookings[slot.id];
                      return (
                        <div key={slot.id} style={{ padding: "11px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: b ? 1 : 0.35 }}>
                          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#555", minWidth: 95, fontWeight: b ? 600 : 400 }}>{slot.timeRange}</span>
                            {b
                              ? <span style={{ background: "#F5C800", color: "#1a1a1a", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{b.name}</span>
                              : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#ccc" }}>—</span>
                            }
                          </div>
                          {b && <button onClick={() => handleRemove(slot.id)} style={{ background: "none", border: "1px solid #eee", borderRadius: 6, color: "#bbb", cursor: "pointer", fontSize: 11, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif" }}>Remove</button>}
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
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa", fontSize: 13, margin: "0 0 22px", lineHeight: 1.6 }}>
              Tap an available slot to lock in your session. Your name will show once booked. 👇
            </p>
            {COACHES.map((coach, ci) => {
              const slots = generateSlots(coach);
              const coachBooked = slots.filter(s => bookings[s.id]).length;
              const spotsLeft = coach.maxSlots - coachBooked;
              return (
                <div key={coach.id} className="fade-in" style={{ marginBottom: 20, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", animationDelay: `${ci * 0.08}s` }}>
                  <div style={{ background: "#1a1a1a", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: "#F5C800", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "#1a1a1a", flexShrink: 0 }}>
                        {coach.initial}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "#fff", letterSpacing: 2, lineHeight: 1 }}>{coach.name}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#888", marginTop: 3 }}>{coach.date} · {coach.slotMinutes}min sessions</div>
                      </div>
                    </div>
                    {spotsLeft === 0
                      ? <span style={{ background: "#2a2a2a", color: "#666", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "5px 12px", borderRadius: 20, letterSpacing: 1 }}>FULL</span>
                      : <span style={{ background: "#F5C800", color: "#1a1a1a", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "5px 12px", borderRadius: 20, letterSpacing: 0.5 }}>{spotsLeft} SPOT{spotsLeft !== 1 ? "S" : ""} LEFT</span>
                    }
                  </div>
                  <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 10 }}>
                    {slots.map(slot => {
                      const booked = bookings[slot.id];
                      return (
                        <button key={slot.id} className="slot-btn" disabled={!!booked}
                          onClick={() => { setSelectedSlot({ slotId: slot.id, coachId: coach.id, coachName: coach.name, timeRange: slot.timeRange, date: coach.date }); setConfirming(true); }}
                          style={{ padding: "14px 8px", borderRadius: 12, border: `1.5px solid ${booked ? "#f0f0f0" : "#e8e8e8"}`, background: booked ? "#fafafa" : "#fff", color: booked ? "#bbb" : "#1a1a1a", cursor: booked ? "default" : "pointer", textAlign: "center" }}
                        >
                          <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: booked ? 400 : 700 }}>{slot.time}</div>
                          {booked
                            ? <div style={{ marginTop: 5, background: "#F5C800", color: "#1a1a1a", fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "2px 7px", borderRadius: 10, display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booked.name}</div>
                            : <div style={{ marginTop: 5, fontSize: 10, color: "#ccc", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>AVAILABLE</div>
                          }
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
          <div className="fade-in" style={{ background: "#fff", borderRadius: 20, padding: "30px 24px", maxWidth: 380, margin: "0 auto", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>🐯</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 2.5, color: "#bbb", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Confirm Your Booking</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: "#1a1a1a", letterSpacing: 1.5, marginBottom: 4 }}>{selectedSlot.coachName}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#aaa", marginBottom: 26 }}>{selectedSlot.timeRange} · {selectedSlot.date}</div>

            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, fontWeight: 600 }}>Your Name</label>
            <input autoFocus value={playerName} onChange={e => setPlayerName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleBook()}
              placeholder="e.g. Sarah"
              style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${playerName.trim() ? "#F5C800" : "#e8e8e8"}`, background: "#fafafa", color: "#1a1a1a", fontSize: 15, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none", marginBottom: 20, transition: "border 0.15s" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setConfirming(false); setSelectedSlot(null); setPlayerName(""); }}
                style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1.5px solid #eee", background: "transparent", color: "#bbb", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                Back
              </button>
              <button onClick={handleBook} disabled={!playerName.trim() || saving}
                style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: playerName.trim() ? "#1a1a1a" : "#f0f0f0", color: playerName.trim() ? "#F5C800" : "#ccc", cursor: playerName.trim() ? "pointer" : "default", fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: 1, transition: "all 0.15s" }}>
                {saving ? "Booking…" : "CONFIRM ✓"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
