import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment demo",
  robots: { index: false },
};

export default function PaymentDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
