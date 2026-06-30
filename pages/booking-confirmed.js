// pages/booking-confirmed.js
import { useRouter } from 'next/router';

export default function BookingConfirmed() {
  const router = useRouter();
  const { session_id } = router.query;

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>You're all set! 🎉</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Your slip is reserved and paid. A confirmation email is on its way.
      </p>
      <p style={{ fontSize: 12, color: '#999' }}>
        Reference: {session_id ? session_id.slice(0, 24) + '…' : ''}
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: 24, color: '#185FA5' }}>
        ← Back to slip map
      </a>
    </div>
  );
}
