import { BrandLogo } from "@/components/BrandLogo";

/**
 * Route-transition fallback; page-level skeletons take over from here.
 * Red wordmark on beige is an approved brand lockup (red on white is not).
 */
export default function Loading() {
  return (
    <div className="on-beige flex min-h-[100dvh] items-center justify-center" role="status" aria-busy="true" aria-label="Loading">
      <span className="animate-pulse text-red">
        <BrandLogo className="h-10" />
      </span>
    </div>
  );
}
