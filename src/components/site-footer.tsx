export function SiteFooter({ note }: { note: string }) {
  return (
    <footer className="site-footer">
      <span>Kim Jungho · Creative Engineer / Researcher</span>
      <span>{note}</span>
    </footer>
  );
}
