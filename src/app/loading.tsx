export default function Loading() {
  return (
    <main className="route-state" aria-label="Loading Nepal Work Atlas">
      <div className="skeleton-shell" aria-hidden="true">
        <div className="skeleton-line" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
        <div className="skeleton-card" />
      </div>
      <span className="sr-only">Loading Nepal Work Atlas</span>
    </main>
  );
}
