import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen console",
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
