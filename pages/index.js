// pages/index.js
import { useEffect, useState } from 'react';

const DAYS = [
  { value: '2026-07-10', label: 'Friday', date: 'July 10', sub: 'Airshow at 5pm' },
  { value: '2026-07-11', label: 'Saturday', date: 'July 11', sub: 'Airshow at 5pm' },
  { value: '2026-07-12', label: 'Sunday', date: 'July 12', sub: 'Airshow at 2pm' },
];

// Bookable Dock C Blue slips only, in physical dock order (two arms meeting at the point)
const ARM_A = ['15A', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3'];
const ARM_B = ['38A', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50'];

const colors = {
  bg: '#FAF7F2',
  card: '#FFFFFF',
  border: '#E4DED3',
  ink: '#1F2A24',
  inkMuted: '#5C6B62',
  ocean: '#185FA5',
  oceanLight: '#E6F1FB',
  oceanBorder: '#9FC7EC',
  taken: '#EEEAE2',
  takenText: '#A39C8E',
  accent: '#0E7C5A',
};

export default function Home() {
  const [slips, setSlips] = useState([]);
  const [day, setDay] = useState(DAYS[0].value);
  const [loading, setLoading] = useState(true);
  const [modalSlip, setModalSlip] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', boatName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);

  async function loadSlips() {
    const res = await fetch('/api/slips');
    const data = await res.json();
    setSlips(data.slips || []);
    setLoading(false);
  }

  useEffect(() => {
    loadSlips();
    const interval = setInterval(loadSlips, 10000);
    return () => clearInterval(interval);
  }, []);

  const daySlips = slips.filter((s) => s.day.slice(0, 10) === day);
  const slipStatus = (n) => daySlips.find((s) => s.slip_number === n)?.status || 'open';
  const openCount = [...ARM_A, ...ARM_B].filter((n) => slipStatus(n) === 'open').length;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipNumber: modalSlip, day, ...form }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setSubmitting(false);
      await loadSlips();
      return;
    }

    window.location.href = data.url;
  }

  function Slip({ n }) {
    const status = slipStatus(n);
    const open = status === 'open';
    return (
      <button
        disabled={!open}
        onClick={() => open && setModalSlip(n)}
        style={{
          height: 46,
          minWidth: 46,
          borderRadius: 8,
          border: `1.5px solid ${open ? colors.oceanBorder : colors.border}`,
          background: open ? colors.oceanLight : colors.taken,
          color: open ? colors.ocean : colors.takenText,
          cursor: open ? 'pointer' : 'not-allowed',
          textDecoration: open ? 'none' : 'line-through',
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'transform 0.1s, background 0.15s',
          padding: '0 4px',
        }}
        onMouseEnter={(e) => open && (e.currentTarget.style.background = '#CFE4F8')}
        onMouseLeave={(e) => open && (e.currentTarget.style.background = colors.oceanLight)}
      >
        {n}
      </button>
    );
  }

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", color: colors.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, color: colors.inkMuted, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase' }}>
            Tiki Lee's Dock Bar - Sparrows Point, MD
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0, marginBottom: 6 }}>
            Reserve your slip for the airshow
          </h1>
          <p style={{ color: colors.inkMuted, fontSize: 15, margin: 0 }}>
            Dock C Blue, $175 per slip per day
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {DAYS.map((d) => {
            const active = day === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setDay(d.value)}
                style={{
                  flex: 1,
                  padding: '14px 10px',
                  borderRadius: 12,
                  border: `1.5px solid ${active ? colors.ocean : colors.border}`,
                  background: active ? colors.ocean : colors.card,
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 15, color: active ? '#fff' : colors.ink }}>{d.label}</div>
                <div style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.85)' : colors.inkMuted, marginTop: 2 }}>
                  {d.date} - {d.sub}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          <span style={{ color: colors.inkMuted }}>
            <strong style={{ color: colors.accent, fontWeight: 500 }}>{openCount}</strong> of {ARM_A.length + ARM_B.length} slips open
          </span>
          <button
            onClick={() => setShowMap((s) => !s)}
            style={{
              border: 'none',
              background: 'none',
              color: #C0392B,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            {showMap ? 'Hide dock map' : 'View dock map'}
          </button>
        </div>

        {showMap && (
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
            <img src="/slip-map.jpg" alt="Tiki Lee's dock slip map showing Dock C Blue layout" style={{ width: '100%', display: 'block' }} />
          </div>
        )}

        {loading ? (
          <p style={{ color: colors.inkMuted, textAlign: 'center' }}>Loading availability...</p>
        ) : (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: colors.inkMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Dock C Blue - side A
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
              {ARM_A.map((n) => <Slip key={n} n={n} />)}
            </div>

            <div style={{ fontSize: 13, fontWeight: 500, color: colors.inkMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Dock C Blue - side B
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ARM_B.map((n) => <Slip key={n} n={n} />)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: 13, color: colors.inkMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: colors.oceanLight, border: `1.5px solid ${colors.oceanBorder}`, display: 'inline-block' }} />
            Available
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: colors.taken, border: `1.5px solid ${colors.border}`, display: 'inline-block' }} />
            Reserved
          </span>
        </div>
      </div>

      {modalSlip && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(20,24,21,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setModalSlip(null)}
        >
          <form
            onSubmit={handleSubmit}
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380, maxWidth: '100%', fontFamily: 'inherit' }}
          >
            <h2 style={{ fontSize: 19, fontWeight: 500, margin: 0, marginBottom: 4 }}>Reserve slip {modalSlip}</h2>
            <p style={{ color: colors.inkMuted, fontSize: 13, marginBottom: 18, marginTop: 0 }}>
              {DAYS.find((d) => d.value === day)?.label}, {DAYS.find((d) => d.value === day)?.date} - $175

            </p>

            {error && (
              <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 14, background: '#FBEAEA', padding: '8px 12px', borderRadius: 8 }}>
                {error}
              </p>
            )}

            {['name', 'email', 'phone', 'boatName'].map((field) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: colors.inkMuted, display: 'block', marginBottom: 5 }}>
                  {field === 'boatName' ? 'Boat name (optional)' : field[0].toUpperCase() + field.slice(1)}
                </label>
                <input
                  required={field !== 'boatName'}
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setModalSlip(null)}
                style={{
                  flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${colors.border}`,
                  background: '#fff', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', color: colors.ink,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1, padding: 11, borderRadius: 10, border: 'none',
                  background: colors.ocean, color: '#fff', fontWeight: 500,
                  fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
                }}
              >
                {submitting ? 'Redirecting...' : 'Pay $175'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
