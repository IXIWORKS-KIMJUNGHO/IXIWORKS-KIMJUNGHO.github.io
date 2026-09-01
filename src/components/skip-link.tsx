export function SkipLink({ label = "Skip to main content" }: { label?: string }) {
  return (
    <a className="skip-link" href="#main-content">
      {label}
    </a>
  );
}
