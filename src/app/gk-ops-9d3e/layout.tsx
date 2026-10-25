import "../admin.css";

export const metadata = { title: "Operations · Goodkind", robots: { index: false, follow: false } };

export default function OperationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-root">{children}</div>;
}
