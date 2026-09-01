import { BrandLogo } from "@/components/BrandLogo";

/** Route-transition fallback; page-level skeletons take over from here. */
export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper-100" aria-busy="true" aria-label="Loading">
      <span className="animate-pulse text-red">
        <BrandLogo className="h-10" />
      </span>
    </div>
  );
}
