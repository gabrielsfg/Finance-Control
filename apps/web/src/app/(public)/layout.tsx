export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background flex min-h-screen flex-col">{children}</div>;
}
