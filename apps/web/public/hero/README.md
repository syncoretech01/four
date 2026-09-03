# Hero photo strip

The home page hero is a solid red type block; below it a strip of four
photographs hangs into the white section (`src/components/hero/PhotoStrip.tsx`).
The four are the product pillars, cropped 4:5 from the brand shoot and ordered
dark / yellow / dark / yellow so the two red FOUR props sit in the middle.

| File | Source (`brand-assets/photos`) | Frame |
|---|---|---|
| `strip-smash.jpg` | `v5r09470.jpg` | Texas Flamin' Hot smash, black backdrop, wood board |
| `strip-fries.jpg` | `v5r09608.jpg` | loaded fries in the red FOUR tray on marigold |
| `strip-crown.jpg` | `v5r09505.jpg` | crown crust pizza on the red FOUR box, black backdrop |
| `strip-shake.jpg` | `v5r09638.jpg` | FOUR shake cup with the red straw on marigold |

Each ships at 1040x1300 plus a 640x800 `@640` variant (`srcSet`), nothing is
upsampled, and the only grade is the CSS `saturate(1.06) contrast(1.03)` on
`.f-strip img`. Alt text lives in `PhotoStrip.tsx`.

## Re-cutting a frame

macOS `sips` is enough. `-c H W --cropOffset Y X` crops H x W from (X, Y);
landscape sources give a native 1066x1333 4:5 crop, the portrait shake a
1333x1666 one. Check the result against the other three before committing.

```bash
P=brand-assets/photos; O=apps/web/public/hero
sips -c 1333 1066 --cropOffset 0 527 $P/v5r09470.jpg --out $O/strip-smash.jpg
sips -c 1333 1066 --cropOffset 0 560 $P/v5r09608.jpg --out $O/strip-fries.jpg
sips -c 1333 1066 --cropOffset 0 507 $P/v5r09505.jpg --out $O/strip-crown.jpg
sips -c 1666 1333 --cropOffset 220 0 $P/v5r09638.jpg --out $O/strip-shake.jpg
for f in smash fries crown shake; do
  sips -z 1300 1040 -s format jpeg -s formatOptions 80 $O/strip-$f.jpg
  sips -z 800 640 -s format jpeg -s formatOptions 78 $O/strip-$f.jpg --out $O/strip-$f@640.jpg
done
```

The retired hero video master (`fourhero.mp4`, 14 MB, HEVC) lives at
`brand-assets/video/fourhero.mp4`, gitignored and local only; the storefront
no longer ships any video.
