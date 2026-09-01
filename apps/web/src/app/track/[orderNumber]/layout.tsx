import type { Metadata } from "next";

// The page is a client component, so its metadata lives here. Tracking pages
// are personal and short-lived - robots.txt disallows them and this is the
// belt to those braces.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Track order ${orderNumber.toUpperCase()}`,
    robots: { index: false },
  };
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
