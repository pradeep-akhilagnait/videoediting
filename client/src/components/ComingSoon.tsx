/** Placeholder for sections that aren't built yet. */
export const ComingSoon = ({ title }: { title: string }) => (
  <div className="page-content">
    <div className="page-head">
      <h1>{title}</h1>
    </div>
    <div className="card coming-soon">
      <div className="coming-soon-badge">Coming soon</div>
      <p className="muted">This section is being built. It will appear here once it's ready.</p>
    </div>
  </div>
);
