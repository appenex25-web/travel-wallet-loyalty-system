# Travel Wallet POS — Pixel Spec (1920×1080)

This spec is the “source of truth” for Cursor to reproduce the UI as close as possible to the provided mockup.

## Files
- `mockups/01-mockup.png` — target UI (1920×1080)
- `assets/bg-everest.jpg` — background image (1920×1080)
- `assets/icons/*.svg` — logo + action icons
- `theme.css` — CSS variables for tokens

## Canvas / Grid
- Page size: **1920×1080**
- Center content max width: **1240px**
- 3-column grid gap: **28px**
- Global padding: **48px** left/right, **32px** top

## Top Bar
- Height: **72px**
- Background: glass (blur 22–28px), white 10–14% opacity
- Left: logo (28px) + “Travel Wallet”
  - Font size: 26px
  - Weight: 700
  - Color: #2F7DFF
- Right: Segmented pill
  - Overall: 280×48px, radius 24px
  - POS (active): blue gradient
  - Admin (inactive): white 18% opacity
  - Avatar circle: 32×32px between tabs

## Headline
- Title: “Point of Sale”
  - Font size: 56px
  - Weight: 800
  - Color: #2F7DFF
  - Letter spacing: -0.5px
- Subtitle:
  - Font size: 18px
  - Weight: 500
  - Color: rgba(11, 27, 58, 0.65)
  - Text shadow: subtle (0 2px 12px rgba(255,255,255,0.35))

## Main Cards (3)
- Card size: **360×430px**
- Radius: **28px**
- Background: rgba(255,255,255,0.16)
- Border: 1px solid rgba(255,255,255,0.30)
- Blur: 28px
- Shadow: 0 22px 70px rgba(47,125,255,0.20)
- Inner padding: 24px

### Card Header
- Font size: 20px, weight 700, color #0B1B3A, opacity 0.88
- Margin bottom: 16px

### Input
- Height: 44px
- Radius: 16px
- Background: rgba(255,255,255,0.60)
- Border: 1px solid rgba(255,255,255,0.55)
- Placeholder color: rgba(11,27,58,0.45)

### Primary Button
- Height: 46px
- Radius: 16px
- Gradient: #4FA3FF → #2F7DFF
- Glow: 0 14px 40px rgba(47,125,255,0.35)

### Secondary Button
- Height: 46px
- Radius: 16px
- Background: rgba(255,255,255,0.25)
- Border: 1px solid rgba(255,255,255,0.45)

## Bottom Quick Actions (3)
- Tile size: **260×92px**
- Radius: 26px
- Background: rgba(255,255,255,0.16)
- Border: 1px solid rgba(255,255,255,0.30)
- Icon circle: 44×44px, gradient blue, center icon
- Gap between tiles: 22px
- Position: centered, ~86px from bottom

## Background Overlay
- Apply a readability overlay:
  - linear-gradient(180deg, rgba(234,246,255,0.45) 0%, rgba(79,163,255,0.10) 55%, rgba(47,125,255,0.06) 100%)
