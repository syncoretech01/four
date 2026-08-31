#!/bin/sh
# Everything the converter needs built, in dependency order. Wired as
# cfg.buildCmd, so resync.mjs runs it before each build. Run from the repo root.
set -e

# 1. @four/shared - Visit and Footer read BRAND and HOURS_LABEL from its dist.
pnpm --filter @four/shared build

# 2. .d.ts contracts. apps/web is a Next app with noEmit, so the design-system
#    entry carries its own tsconfig purely to emit declarations; without them
#    every <Name>Props degrades to `[key: string]: unknown`.
./apps/web/node_modules/.bin/tsc -p .design-sync/ds-pkg/tsconfig.json

# 3. The compiled stylesheet. MUST run after 1-2 and after any preview edit:
#    Tailwind v4 emits only the utilities it finds in the scanned sources, and
#    .design-sync/previews is one of them (see @source in styles/ds.css). Skip
#    this after adding a class to a preview and that class silently does
#    nothing - a grid-cols-4 that renders as one column, with no error anywhere.
./.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/styles/ds.css -o .design-sync/ds-pkg/styles.css
