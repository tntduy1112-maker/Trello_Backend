# Design System — MIND Digital Bank

## 1. Visual Theme & Atmosphere

MIND's portal is a vibrant, youthful fintech dashboard built on three uncompromising principles: **flat**, **typographic**, and **brand-anchored**. The page opens on a clean white canvas (`#ffffff`) with pure black headings (`#000000`) and a signature hot pink (`#FF37A5`) that functions as both brand anchor and interactive accent. This isn't a passive pastel pink — it's an assertive, saturated magenta-pink that reads as energetic, modern, and unmistakably MIND.

The primary typeface is **Inter**, loaded from Google Fonts. Inter's generous x-height, open apertures, and carefully tuned spacing make it exceptionally readable at every size — from 10px micro labels to 28px section headings. No OpenType features or alternate stylistic sets are required; Inter's default character set is the brand voice. No monospace companion is needed — Inter handles both prose and data contexts.

The overall typographic approach is **compact** — calibrated for information-dense dashboards where screen real estate is precious. Body text lives at 14px, labels at 12px, and the entire scale is tighter than typical marketing systems. Hierarchy comes from weight contrast and whitespace, not size jumps. At the top of the scale (28px section headings), Inter runs at weight 300 — an unusually light weight for headings that reads as confident and engineered. Negative letter-spacing (-0.56px at 28px) tightens the text into dense, deliberate blocks.

**The MIND portal is strictly flat.** No shadows. No elevation tricks. No gradients. Depth and hierarchy are communicated through three mechanisms only: (1) a hairline 1px border `#e5edf5`, (2) background contrast between pure white and subtle brand tint overlays, and (3) typographic weight and size. When an element needs to feel "raised" or "focused", it gets a brand-colored border (`#FF37A5`) or a subtle tint background — never a shadow, never a gradient fill.

CTA buttons are **pill-shaped** (`border-radius: 100px`) — a deliberate departure from conservative rounding. The pill shape signals approachability, tap-friendliness, and a modern mobile-first attitude. All other containers follow a strict 4–8–12–16 radius scale depending on their role.

## 2. Color Palette & Roles

### Primary
- **Black** (`#000000`): Primary heading color, nav text, strong labels. Pure black — no warmth, no blue undertone.
- **Pure White** (`#ffffff`): Page background, card surfaces, button text on brand backgrounds.

### Brand
Only three brand colors exist. Do not introduce additional shades, tints, or variants.
- **Brand** (`#FF37A5`): Primary brand color. CTA backgrounds, link text, interactive highlights, active states, selected element borders. The single source of truth for "interactive".
- **Brand Hover** (`#E6308F`): Hover state on primary elements. ~10% darker than Brand.
- **Brand Pressed** (`#BF2A7B`): Pressed/active state. ~25% darker than Brand.
- **Brand Tint** (`rgba(255,55,165,0.08)`): The one permitted transparent overlay — used for hover backgrounds, active row highlights, and selected state fills. Not a color variant; a functional alpha overlay on the brand.

### Accent
- **Ruby** (`#ea2261`): The only accent color. Used for error states, destructive actions, and critical alerts. NEVER for primary buttons, NEVER for links. Decorative role only.

### Neutral Scale
- **Heading** (`#000000`): Primary headings, nav text, strong labels.
- **Label** (`#273951`): Form labels, secondary headings, table values.
- **Body** (`#64748d`): Secondary text, descriptions, captions, metadata.
- **Success Green** (`#15be53`): Success status indicator. Use with alpha for backgrounds.
- **Success Text** (`#108c3d`): Success badge text color.
- **Lemon** (`#9b6829`): Warning and caution accent.

### Surface & Borders
- **Border Default** (`#e5edf5`): The single border color for all cards, dividers, inputs, and containers. Do not introduce additional border colors — when a border needs emphasis, it becomes `#FF37A5` (Brand) instead.

## 3. Typography Rules

### Font Family
- **Primary (and only)**: `Inter`, loaded from Google Fonts. Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
- **No monospace**: Inter is used for all contexts including data, labels, and code-like elements.
- **No OpenType features required**: Inter's default glyph set is the brand voice. No `ss01`, no `tnum` overrides needed.

### Hierarchy

The system uses a **compact scale** — optimized for information-dense dashboards and data-driven interfaces. Sizes are deliberately smaller than typical marketing/landing page systems. The goal is maximum information per viewport without sacrificing readability.

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Section Heading | Inter | 28px (1.75rem) | 300 | 1.10 (tight) | -0.56px | Page titles, feature section titles |
| Sub-heading | Inter | 18px (1.13rem) | 300 | 1.10 (tight) | -0.18px | Card headings, smaller section heads |
| Body Large | Inter | 15px (0.94rem) | 300 | 1.45 | normal | Feature descriptions, intro text |
| Body | Inter | 14px (0.88rem) | 300–400 | 1.45 | normal | Standard reading text |
| Button | Inter | 14px (0.88rem) | 500 | 1.00 (tight) | normal | Primary button text |
| Button Small | Inter | 13px (0.81rem) | 500 | 1.00 (tight) | normal | Secondary/compact buttons |
| Nav Link | Inter | 12px (0.75rem) | 500 | 1.00 (tight) | normal | Sidebar nav, navigation links |
| Section Label | Inter | 10px (0.63rem) | 600 | 1.20 | 0.8px | Sidebar section titles, uppercase |
| Caption | Inter | 12px (0.75rem) | 400 | 1.35 | normal | Small labels, metadata, KPI labels |
| Caption Small | Inter | 11px (0.69rem) | 300–400 | 1.35 | normal | Fine print, timestamps, sub-labels |
| Caption Tabular | Inter | 11px (0.69rem) | 400 | 1.33 | -0.3px | Financial data, numbers |
| Micro | Inter | 10px (0.63rem) | 300 | 1.15 (tight) | 0.1px | Tiny labels, axis markers |

### Principles
- **Compact by default**: This is a dashboard-first system. Every size is calibrated for dense information display, not marketing splash pages. If something feels "too small", it's probably right — whitespace and hierarchy do the heavy lifting, not font size.
- **Light weight as signature**: Weight 300 at display sizes is the most distinctive choice. Lightness reads as luxury and confidence.
- **Single typeface simplicity**: Inter handles everything. No font-switching, no cognitive load.
- **Progressive tracking**: Letter-spacing tightens with size: -0.56px at 28px, -0.18px at 18px, normal at 15px and below.
- **Two-weight simplicity**: Primarily 300 (body and headings), 400–500 (UI/buttons), and 600 (section labels only). No heavy display weights.

## 4. Iconography

### Icon Library
- **Library**: Phosphor Icons (https://phosphoricons.com)
- **License**: MIT — free for commercial use
- **Total icons**: 1,500+ glyphs × 6 weights = 9,000+ variants
- **Delivery**: Web font loaded per-weight from jsDelivr CDN. Uses Unicode Private Use Area (PUA) codes — if the font fails to load, icons degrade to invisible/empty characters instead of displaying raw text names. This is a critical advantage over ligature-based icon fonts.

### Why Phosphor Icons
Phosphor is a modern, flexible icon family with six distinct weights (`thin`, `light`, `regular`, `bold`, `fill`, `duotone`) that share a consistent geometric grid. The **bold** weight is the default for MIND — its 2px stroke gives icons enough visual presence to hold their own next to Inter's weight-300 headings and the saturated hot-pink brand, without feeling thin or fragile at small sizes. Phosphor uses `<i>` tags with CSS classes (not ligatures), so it avoids the most common icon-font failure mode: rendering raw icon names as visible text when the font hasn't loaded. Icons inherit `color` and `font-size` from their parent, behaving like any other text character alongside Inter.

### Rules
- **Weight**: `bold` (class `ph-bold`) is the **only** default weight. All icons across the UI use `ph-bold` — nav, tables, buttons, badges, detail panels, everywhere. Use `ph-fill` only for: (a) explicit status glyphs in badges (filled `ph-check-circle`, filled `ph-warning-circle`), (b) active navigation state where fill communicates selection. Do NOT mix `thin`/`light`/`regular`/`duotone` into the UI — they fragment the visual language. Bold is the single source of truth for icon weight.
- **Sizes**: controlled via CSS `font-size`. Pick `16px`, `18px`, `20px`, or `24px`. Never arbitrary values. Default `18px`, compact `16px`, large `20px`, hero `24px`.
- **Minimum size**: `16px`. Phosphor glyphs remain crisp at this size due to their pixel-aligned grid.
- **Color**: Icons inherit from parent `color` automatically (they ARE text). Never fade with `opacity` — use a lighter parent color instead. Only override for explicit status icons (success green, error ruby).
- **Icon–text proportionality**: scale both together.
  - Text 10–12px → icon **16px** (compact — sidebar, badges, dense tables)
  - Text 13–14px → icon **18px** (standard — buttons, card titles, body)
  - Text 15–18px → icon **20px** (feature descriptions, sub-headings)
  - Text 20px+ → icon **24px** (hero, empty states)
- **Line-height**: always `1` on the icon element to prevent extra vertical space from inflating containers.
- **Icon names use hyphens** (`calendar-blank`, `caret-right`, `magnifying-glass`). Always prefix with `ph-` in the class.
- **Do not wrap in extra SVG containers** — icons are text glyphs, controlled purely by `font-size` and `color`.

### Usage
```html
<!-- In <head>: load only the weights you need -->
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css" />
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" />

<!-- Markup: <i> tag with weight class + icon class -->
<i class="ph-bold ph-squares-four"></i>          <!-- bold weight (default) -->
<i class="ph-fill ph-check-circle"></i>          <!-- fill weight for status -->
<i class="ph-bold ph-magnifying-glass"></i>      <!-- search icon -->

<!-- Sizing via CSS -->
<style>
  i[class^="ph"] { line-height: 1; vertical-align: middle; }
  .icon-16 { font-size: 16px; }
  .icon-18 { font-size: 18px; }
  .icon-20 { font-size: 20px; }
  .icon-24 { font-size: 24px; }
</style>

<i class="ph-bold ph-user icon-18"></i>
```

### Common Icon Mapping

| Context | Class (after `ph-bold ph-`) | Fill variant | Notes |
|---------|----------------------|-------------|-------|
| Dashboard | `squares-four` | `ph-fill ph-squares-four` | Sidebar nav |
| Transactions | `arrows-left-right` | — | Money movement |
| Customers | `users` | `ph-fill ph-users` | User management |
| Cards | `credit-card` | `ph-fill ph-credit-card` | Card product |
| Reports | `chart-bar` | `ph-fill ph-chart-bar` | Analytics |
| Real-time | `pulse` | — | Live data |
| Settings | `gear` | `ph-fill ph-gear` | Configuration |
| Search | `magnifying-glass` | — | Global search |
| Add/New | `plus` | — | Create actions |
| Export | `download-simple` | — | Data export |
| Success | `check` | `ph-fill ph-check-circle` | Confirmation |
| Warning | `warning` | `ph-fill ph-warning` | Alerts (triangle) |
| Error | `warning-circle` | `ph-fill ph-warning-circle` | Error states |
| Revenue | `trend-up` | — | Growth metrics |
| Calendar | `calendar-blank` | `ph-fill ph-calendar-blank` | Date-related |
| Notification | `bell` | `ph-fill ph-bell` | Alerts |
| Close | `x` | — | Dismiss, cancel |
| Arrow/Link | `arrow-right` | — | Navigation CTA |
| Chevron down | `caret-down` | — | Dropdowns, expand |
| Chevron right | `caret-right` | — | Breadcrumbs, accordions |
| More | `dots-three` | — | Overflow menu |
| Filter | `funnel` | — | Filter controls |
| User profile | `user` | `ph-fill ph-user` | Account menu |
| Help | `question` | `ph-fill ph-question` | Support, tooltips |
| Verified | `seal-check` | `ph-fill ph-seal-check` | eKYC approved state |
| Shield | `shield-check` | `ph-fill ph-shield-check` | Security, verification |
| ID Card | `identification-card` | — | CCCD / citizen ID |
| Eye / View | `eye` | — | View details |
| Clock | `clock` | `ph-fill ph-clock` | Time, pending |
| Prohibit | `prohibit` | — | Blocked, rejected |
| Flag | `flag` | `ph-fill ph-flag` | Risk alerts |
| Info | `info` | `ph-fill ph-info` | Informational notes |
| Sort asc | `sort-ascending` | — | Table sort |
| Sort desc | `sort-descending` | — | Table sort |
| QR Code | `qr-code` | — | QR display |
| Upload | `upload-simple` | — | File upload |
| History | `clock-counter-clockwise` | — | Activity log |

## 5. Component Stylings

### Buttons

Only two button variants exist in the system. Do not introduce tertiary, info, or neutral variants — they fragment the interactive language.

**Primary Brand (CTA)**
- Background: `#FF37A5`
- Text: `#ffffff`
- Padding: 8px 20px
- Radius: **100px** (pill)
- Font: 14px Inter weight 500
- Border: none
- Hover: `#E6308F` background
- Pressed: `#BF2A7B` background
- Use: Primary CTA — the single most important action in a view

**Ghost / Secondary**
- Background: transparent
- Text: `#FF37A5`
- Padding: 8px 20px
- Radius: **100px** (pill)
- Border: `1px solid #FF37A5`
- Font: 14px Inter weight 500
- Hover: background shifts to `rgba(255,55,165,0.08)` (Brand Tint)
- Pressed: background shifts to `rgba(255,55,165,0.16)` (2× Brand Tint)
- Use: Secondary actions sitting beside a primary CTA

### Cards & Containers
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- **No shadow, ever** — depth is communicated by the border alone
- Radius: follows the 4–8–12–16 scale (see Layout section)
- Hover (if interactive): border shifts to `#000000` OR background shifts to `rgba(255,55,165,0.08)` — never both, never a shadow

### Badges / Tags / Pills

**Success Badge**
- Background: `rgba(21,190,83,0.12)`
- Text: `#108c3d`
- Padding: 2px 8px
- Radius: 4px
- Border: `1px solid rgba(21,190,83,0.35)`
- Font: 10px weight 500

**Error Badge**
- Background: `rgba(234,34,97,0.08)`
- Text: `#ea2261`
- Padding: 2px 8px
- Radius: 4px
- Border: `1px solid rgba(234,34,97,0.3)`
- Font: 10px weight 500

### Inputs & Forms
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 4px
- Focus: border `1px solid #FF37A5` (no ring, no glow, just a solid color swap)
- Label: `#273951`, 12px Inter weight 500
- Text: `#000000`
- Placeholder: `#64748d`
- Disabled: background `#fafbfd`, text `#64748d`, border unchanged

### Navigation
- Clean horizontal nav on white, sticky with backdrop-filter `blur(12px)` (the one permitted transparency effect — it's not elevation, it's content visibility)
- Brand logotype left-aligned
- Links: Inter 12px weight 500, `#000000` text
- Active link: `#FF37A5` text, with `rgba(255,55,165,0.08)` background fill
- Radius: 8px on nav container (follows the standard scale)
- CTA: brand pill button right-aligned

## 6. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Grid & Container
- Max content width: approximately 1080px for focused pages, 1440px for data-dense dashboards
- Feature sections: 2–3 column grids for feature cards
- Dashboard previews as contained cards with a 1px `#e5edf5` border

### Whitespace Philosophy
- **Precision spacing**: Measured, purposeful whitespace. Every gap is a deliberate typographic choice.
- **Dense data, generous chrome**: Data displays are tightly packed, but the UI chrome around them is generously spaced.
- **Section rhythm**: Use whitespace and section labels to separate content blocks. Do not reach for background color changes or borders where a 48px gap would do.

### Border Radius Scale

A disciplined 4-step scale plus the pill exception. No arbitrary values, no in-between numbers.

| Token | Value | Use |
|-------|-------|-----|
| Small | `4px` | Badges, inputs, small chips, color swatches, tag chips |
| Standard | `8px` | Cards, panels, containers, dropdowns, popovers, alerts |
| Large | `12px` | Featured cards, modal dialogs, side drawers, image containers |
| XL | `16px` | Hero cards, large feature containers, onboarding surfaces |
| Pill | `100px` | **All buttons — no exceptions.** Also used for pill-shaped filter chips and tab selectors. |

Rules:
- Never use `5px`, `6px`, `10px`, or any value outside this scale. If you reach for an in-between value, your component is in the wrong bucket — re-evaluate its role.
- Pills are **buttons only** (plus pill-shaped chip variants of buttons). Never pill a card, never pill a container.
- Radius scales with container importance: a badge (4px) sits inside a card (8px) sits inside a modal (12px). Larger containers get larger radii.

## 7. Flat System (No Elevation)

The MIND portal has **no elevation system**. There are no shadow tokens, no z-depth levels, no "raised" or "floating" cards. The visual system is strictly 2D.

Hierarchy is communicated exclusively through:
1. **Hairline borders** (`1px solid #e5edf5`) — the primary boundary signal
2. **Background contrast** — pure white (`#ffffff`) surfaces against `rgba(255,55,165,0.08)` tint overlays for active/hover states
3. **Typographic weight and size** — heading 28px weight 300 vs body 14px weight 300 creates the reading order

When an element needs emphasis (focused, selected, active), it gets:
- A brand-colored border (`1px solid #FF37A5`), OR
- A brand tint background (`rgba(255,55,165,0.08)`), OR
- A filled brand background (`#FF37A5`) for the single most important action

Never a shadow. Never a gradient. Never a glow. Not even a subtle one.

**Focus ring (accessibility exception)**: Keyboard focus uses `2px solid #FF37A5` outline with `2px` offset. This is the only "layered" treatment in the system, and it exists exclusively for keyboard accessibility.

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Single column, reduced heading sizes, stacked cards |
| Tablet | 640–1024px | 2-column grids, moderate padding |
| Desktop | 1024–1280px | Full layout, 3-column feature grids |
| Large Desktop | >1280px | Centered content with generous margins |

### Touch Targets
- Pill buttons use comfortable padding (10px–24px)
- Navigation links at 12px weight 500 with adequate spacing
- Badges have 6px horizontal padding minimum for tap targets
- Minimum tap target: 44×44px for any interactive element on mobile

### Collapsing Strategy
- Section heading: 28px → 22px on mobile, weight 300 maintained
- Navigation: horizontal links + CTAs → hamburger toggle
- Feature cards: 3-column → 2-column → single column stacked
- Data tables: horizontal scroll on mobile
- Section spacing: 64px+ → 40px on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Brand (`#FF37A5`)
- CTA Hover: Brand Hover (`#E6308F`)
- CTA Pressed: Brand Pressed (`#BF2A7B`)
- Subtle brand overlay: `rgba(255,55,165,0.08)`
- Background: Pure White (`#ffffff`)
- Heading text: Black (`#000000`)
- Label text: Dark Slate (`#273951`)
- Body text: Slate (`#64748d`)
- Border: Soft Blue (`#e5edf5`)
- Link: Brand (`#FF37A5`)
- Success: Green (`#15be53`) with text `#108c3d`
- Error accent: Ruby (`#ea2261`)

### Example Component Prompts
- "Create a hero section on white background. Headline at 28px Inter weight 300, line-height 1.10, letter-spacing -0.56px, color #000000. Subtitle at 15px weight 300, line-height 1.45, color #64748d. Brand CTA pill button (#FF37A5, 100px radius, 8px 20px padding, white text, weight 500) and ghost pill button (transparent, 1px solid #FF37A5, #FF37A5 text, 100px radius)."
- "Design a card: white background, 1px solid #e5edf5 border, 8px radius, no shadow. Title at 14px Inter weight 500, color #000000. Body at 13px weight 300, #64748d."
- "Build a success badge: rgba(21,190,83,0.12) background, #108c3d text, 4px radius, 2px 8px padding, 10px Inter weight 500, border 1px solid rgba(21,190,83,0.35)."
- "Create navigation: white sticky header with backdrop-filter blur(12px). Inter 12px weight 500 for links, #000000 text. Active link: #FF37A5 text with rgba(255,55,165,0.08) background. Phosphor `ph-fill` icon for active state. Brand CTA pill 'Start now' right-aligned (#FF37A5 bg, white text, 100px radius, weight 500)."
- "Design a modal: white background, 1px solid #e5edf5 border, 12px radius, no shadow. Heading 18px Inter weight 300 color #000000. Body 14px weight 300 color #64748d. Primary + ghost button pair in the footer. Output as standalone HTML file."

### Iteration Guide
1. **Compact first** — this is a dashboard system. Default to the smaller end of each size range.
2. **Flat first** — if you catch yourself adding `box-shadow`, stop. The answer is a border or a tint background.
3. **Solid first** — if you catch yourself adding `linear-gradient`, stop. Pick a solid color from the palette.
4. Inter is the only font — no font-switching, no monospace, no OpenType
5. Weight 300 is the default; use 400–500 for UI/buttons, 600 for section labels only
6. Heading color is `#000000`, label is `#273951`, body is `#64748d`
7. ALL buttons are pill-shaped (`border-radius: 100px`) — no exceptions
8. Containers stay on the 4 / 8 / 12 / 16 scale — pills are buttons-only
9. Brand color `#FF37A5` for all interactive elements; hover `#E6308F`; pressed `#BF2A7B`. No other brand shades exist.
10. When adjusting any text size, always adjust paired icon size: 10–12px text → 16px icon (Phosphor minimum), 13–14px → 18px, 15–18px → 20px, 20px+ → 24px. Phosphor sizes are controlled via CSS `font-size` — no axis pairing needed.
11. **No feature descriptions under page titles.** When generating a feature/page, output the H1 only — never add a marketing-style subtitle explaining what the feature does. The title and the UI itself communicate purpose; descriptive paragraphs are noise on a working dashboard.
12. **Table row hover = neutral gray, not brand tint.** Hover background is `#fafbfd`. Brand tint `rgba(255,55,165,0.08)` is reserved exclusively for the **selected** row, so selection and hover stay visually distinct.
13. **Sidebar nav sections must be clearly separated.** Between every nav group, use either (a) generous `32px+` spacing, OR (b) a 1px `#e5edf5` divider with `16px` padding above and below. Never let two sections read as one block.
14. **Sidebar = minimal stub, current feature only.** When generating any single feature/page, the sidebar is stripped to the absolute minimum: just the logo at top, then the section label + nav item + sub-items of the current feature being designed. No skeleton placeholders for other modules, no dividers, no user avatar block, no fake module names. The full sidebar IA is managed separately and must not be rendered or invented per feature. The goal is for the mock to communicate "we're on feature X" with zero noise — every pixel of the sidebar that isn't the current feature is removed entirely, not skeletoned.

15. **`Portal: {name}` directive sets the product name.** This design system is shared across multiple MIND-family (and non-MIND) portals. The product name in the sidebar logo is **never hard-coded as "MIND"** — it must be set per-prompt by a directive the user includes alongside the feature description:

    ```
    Portal: MINDPOS
    Tính năng: ...
    ```

    The directive can appear anywhere in the prompt (top, bottom, inline). When present, the value after `Portal:` becomes:
    - The text in the sidebar logo (e.g., `MINDPOS.`)
    - The single letter of the logo mark — first letter of the name (e.g., `C` for MINDPOS, `M` for Momo, `A` for Ahamove)
    - The product name in the browser `<title>` tag

    The brand color, dot accent, mark background, and all DS tokens stay identical regardless of portal name — only the wordmark changes. **If no `Portal:` directive is present in the prompt, default to `MIND`.** Never invent or guess a portal name from feature context — wait for the explicit directive. Examples of valid values: `MIND`, `MINDPOS`, `MINDBiz`, `Ahamove`, `Momo`, `VNPay Merchant`. Multi-word names are kept as-is in the wordmark; the logo mark uses only the very first letter of the first word.

## 10. Pre-Output Checklist ← AI PHẢI VERIFY TRƯỚC KHI VIẾT BẤT KỲ DÒNG HTML NÀO

> Đây không phải gợi ý. Đây là **điều kiện bắt buộc**. Với mỗi file HTML được tạo ra, AI phải tự kiểm tra và xác nhận từng mục dưới đây **trước khi bắt đầu output**.

---

### 🔴 Sidebar — Rule tuyệt đối, không ngoại lệ

```
Sidebar CHỈ được chứa đúng feature đang build. Không thêm bất kỳ menu nào khác.
```

Cấu trúc hợp lệ DUY NHẤT:
```
Logo
└── 1 × nav-section-label   (tên section của feature, VD: "TÀI CHÍNH")
    1 × nav-item.active      (tên feature, VD: "Thu chi")
    └── nav-sub
        ├── nav-item.active  (sub-page hiện tại)
        └── nav-item         (sub-pages khác trong cùng feature)
```

❌ **SAI — các pattern sau đều bị cấm:**
- Thêm Dashboard vào sidebar
- Thêm bất kỳ section nào ngoài feature đang build (Giao dịch, Thiết bị, Nhân viên, v.v.)
- Thêm 2 nav-section-label trở lên
- Thêm avatar user, footer, hay bất kỳ element nào ngoài logo + nav của feature

---

### 🔴 Topbar

- Tối đa **1 primary CTA** (`btn-primary`) trong topbar
- Utility actions (export, refresh, import) dùng `btn-icon` — không dùng `btn-ghost` trong topbar

---

### 🔴 CSS Base

- Copy **verbatim** toàn bộ block `CAKE DS — BASE TOKENS & RESET` từ template
- Không sửa bất kỳ token nào (màu, font, spacing)
- Không thêm shadow, gradient vào bất kỳ element nào

---

### 🔴 Toast

- Background luôn là `var(--heading)` (đen)
- Không dùng màu khác (xanh, đỏ, brand) cho toast dù bất kỳ lý do gì
- Phân biệt loại toast bằng **icon**, không bằng màu nền

---

### 🟡 Các rule thường bị bỏ sót khác

- Tất cả button đều là **pill** (`border-radius: 100px`) — không ngoại lệ
- Không có shadow trên bất kỳ element nào
- `Portal:` directive trong prompt → dùng đúng tên đó cho logo, title. Không có directive → default `MIND`

---

## 11. Output Format

**Always generate standalone HTML files.** Every feature/page output must be a single `.html` file that opens directly in any modern browser — no build step, no framework dependency, no server required.

### Rules
- Output is always a single `.html` file with `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`.
- All CSS is inlined in a `<style>` block in `<head>` — no external stylesheets except Google Fonts (Inter) and Phosphor Icons CDN.
- All JavaScript is inlined in a `<script>` block before `</body>` — no external JS files, no module imports.
- The file must be **self-contained**: copy it to any machine, open in Chrome/Firefox/Safari, and it works.
- No React, Vue, or any framework. Vanilla HTML + CSS + JS only.
- Font loading: Inter from Google Fonts CDN, Phosphor Icons from jsDelivr CDN. These are the only two external network dependencies.
- If the network is unavailable, the page should degrade gracefully: Inter falls back to the system font stack, Phosphor icons degrade to invisible PUA characters (not raw text).

### File structure
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{PortalName} — {Feature Name}</title>
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <!-- Phosphor Icons (load only weights used) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" />
  <style>
    /* All CSS here */
  </style>
</head>
<body>
  <!-- All markup here -->
  <script>
    // All JS here
  </script>
</body>
</html>
```

## 12. Label & Copy Guidelines

Dashboard labels must be **compact, scannable, and information-dense**. This is an internal operations tool — not a consumer app. Users are trained professionals who understand domain abbreviations.

### Rules
- **Short labels by default.** If a label can be 1–2 words, it must be. "Số điện thoại" → "SĐT". "Trạng thái" → "Status". "Căn cước công dân" → "CCCD".
- **Vietnamese as primary language, English technical terms accepted.** Domain-specific English terms that are universally understood by operators are fine: "Face Match", "Liveness", "OCR", "KYC", "Status", "Score", "ID". Don't force-translate technical jargon.
- **Abbreviations are encouraged.** Common Vietnamese abbreviations: "SĐT" (số điện thoại), "CCCD" (căn cước công dân), "TP.HCM" (Thành phố Hồ Chí Minh), "NS" (ngày sinh). Common English abbreviations: "DOB" (date of birth), "ID", "No." (number).
- **Table column headers = maximum 2 words.** "Thời gian nộp" → "Ngày nộp". "Số CCCD" → "CCCD". "Face Matching Score" → "Face Match".
- **KPI card labels = 1 line, no wrapping.** If it wraps on a 160px card, it's too long.
- **No redundant context.** Inside an "eKYC Management" page, don't label a column "eKYC Status" — just "Status". The page title already provides context.
- **Action buttons = verb + optional noun.** "Duyệt", "Từ chối", "Xuất CSV", "Lọc". Not "Nhấn để phê duyệt hồ sơ này".

## 13. Information-Dense Layout

MIND portal is an **operations dashboard** — operators process hundreds of records per shift. Every click costs time. The layout must maximize visible information per viewport.

### Rules
- **No drawer/modal for record detail by default.** Prefer **split-panel** (table left, detail right) or **expandable rows** that inline the detail below the row. Drawers/modals are acceptable only when detail content is very large (10+ fields + images) AND the table needs full width.
- **Table is the primary view.** Tables must show as many actionable columns as possible: status, key scores (Face Match, Liveness), risk flags, timestamps — all visible without clicking.
- **Inline actions.** Approve/Reject buttons should appear directly on hover or in the row — not buried in a detail panel. Quick actions reduce clicks.
- **Expandable rows over navigation.** Clicking a row can expand it inline to show additional detail (images, scores, notes) without leaving the table context. The operator's scroll position is preserved.
- **KPI bar is compact.** KPI cards sit in a single horizontal row at the top. Maximum 4–5 cards. No tall hero cards, no multi-row KPI grids.
- **Minimize vertical whitespace.** Dense data sections (tables, detail panels) use 8–10px row padding, not 16px. The `dense data, generous chrome` rule means the outer shell has whitespace, but the data grid is tight.
- **Sticky headers.** Table header row is sticky so column labels are always visible while scrolling through records.
- **Batch actions.** Checkboxes on rows + batch action bar (approve all, reject all, export selected) reduce repetitive work.
- **Preview on hover.** Where feasible, hovering a row can show a lightweight tooltip/popover with the customer's photo and key scores — zero-click information access.
