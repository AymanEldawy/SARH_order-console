export default function HomePage() {
  return (
    <main style={{ padding: "3rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>SARH Orders Console</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Phase 1 Foundation complete. Database schema migrated and seeded with 50,000+ orders.
      </p>
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>System Status</h2>
        <p>PostgreSQL Database: <strong>Connected</strong></p>
        <p>Target Orders: <strong>50,000 orders (150,000 line items)</strong></p>
        <p>Default Users: <strong>admin@sarh.dev, agent@sarh.dev</strong></p>
      </div>
    </main>
  );
}
