import type { Metadata } from "next";

// The page is a client component, so its metadata lives here. Personal
// content - kept out of the index.
export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
