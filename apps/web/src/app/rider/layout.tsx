import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rider",
  robots: { index: false },
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
