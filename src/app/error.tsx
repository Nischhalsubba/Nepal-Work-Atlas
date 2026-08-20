"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-state">
      <section className="route-state-card" role="alert">
        <h1>This view could not load</h1>
        <p>The evidence files remain unchanged. Retry the interface before assuming a missing value means zero.</p>
        <button className="primary-button" type="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
