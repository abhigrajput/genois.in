export default function TermsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px', fontFamily: 'var(--font-body)', color: 'var(--gx-text)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Terms of Service</h1>
      <p style={{ color: 'var(--gx-text-muted)', lineHeight: 1.8, fontSize: 14 }}>
        By using GENOIS, you agree to use the platform for educational purposes only. You will not share your account credentials
        or attempt to reverse-engineer our AI systems. GENOIS provides AI-generated content for placement preparation — while we
        strive for accuracy, we do not guarantee placement outcomes. GENOIS is currently in a free placement beta: every feature
        is unlocked at no cost, no payment method is required, and there is no trial period that expires.
        GENOIS reserves the right to modify features and pricing with reasonable notice. For questions, contact support@genois.in.
        These terms were last updated August 2026.
      </p>
    </div>
  );
}
