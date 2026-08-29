# Menu imagery (drop-in)

Two folders, both filled from the brand Drive folder:

## `items/`
One photo per dish, 4:3 or wider, named by the item id from
`src/data/menu.ts`, e.g.:

```
items/bangkok-chipotle.jpg
items/classic-ny-smash.jpg
items/malai-boti-crown.jpg
items/lotus-shake.jpg
...
```

## `boards/`
Scans/exports of the real printed menu, one per category (shown in the
"View the real menu" lightbox):

```
boards/smash-burgers.jpg
boards/chicken-burgers.jpg
boards/pizzas.jpg
boards/wings.jpg
boards/fries.jpg
boards/wraps.jpg
boards/shakes.jpg
boards/desserts.jpg
boards/drinks.jpg
```

Until a file exists the UI shows a branded placeholder tile, never a broken
image. Restaurant photos go in `/public/gallery` as `restaurant-1.jpg`,
`restaurant-2.jpg`.
