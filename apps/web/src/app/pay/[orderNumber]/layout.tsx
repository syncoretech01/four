import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay for your order",
  robots: { index: false },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
