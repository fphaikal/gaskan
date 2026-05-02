# GASKAN Landing Page Redesign — Design Spec

**Date:** 2026-05-03  
**Status:** Approved  
**Scope:** `pages/index.vue` + new `components/Landing/` directory

---

## 1. Overview

Redesign the GASKAN landing page (`/`) from its current minimal single-section layout into a full, polished landing page. The target vibe is **Friendly & Energik** — colorful, playful, and welcoming for students while maintaining the existing brand identity.

**Key goals:**
- First impression that wows visitors and clearly communicates what GASKAN is
- Full dark mode + light mode support with a toggle
- Modular component structure for maintainability
- No external animation libraries — CSS-only animations

---

## 2. Design Language

### Color Palette
| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| Background base | `#181826` | `#FFFDF0` (warm cream) |
| Background surface | `#212134` | `#FFFFFF` |
| Primary | `#F2C300` (yellow) | `#F2C300` (yellow) |
| Primary accent | `#FF6B35` (orange) | `#FF6B35` (orange) |
| Text primary | `#FFFFFF` | `#181826` |
| Text secondary | `#c0c0cf` | `#64748B` |
| Border/stroke | `#2E3A47` | `#E2E8F0` |

### Typography
- Font: **Satoshi** (already configured in tailwind.css)
- Hero heading: `text-5xl` / `text-6xl xl` — extrabold
- Section headings: `text-3xl` — bold
- Body: `text-base` — regular

### Interaction & Motion
- All hover effects use `transition duration-300`
- Navbar: glassmorphism (`backdrop-blur`) on scroll
- Stats: count-up animation on scroll intersection (using VueUse `useIntersectionObserver`)
- Theme toggle: smooth `transition: background-color 0.4s, color 0.4s` on `html` element

---

## 3. Page Architecture

```
pages/index.vue (layout: blank)
├── components/Landing/Navbar.vue
├── components/Landing/Hero.vue
├── components/Landing/Features.vue
├── components/Landing/Stats.vue
├── components/Landing/FAQ.vue
└── components/Landing/Footer.vue

composables/useTheme.ts        ← new, manages dark/light toggle
assets/css/tailwind.css        ← add [data-theme="mytheme-light"] tokens
```

---

## 4. Component Specs

### 4.1 `LandingNavbar.vue`
- **Sticky** positioned, `z-50`
- **Left:** Logo mark (🔑 icon) + "GASKAN" wordmark in bold
- **Center:** Nav links — "Fitur", "Statistik", "FAQ" (smooth scroll to anchor IDs)
- **Right:** Dark/light toggle button (sun ☀️ / moon 🌙 icon) + "Masuk" CTA button (primary yellow, rounded-lg)
- **Scroll effect:** On scroll > 10px, add `backdrop-blur-md bg-base/80 shadow-sm` via Vue scroll listener
- **Mobile:** Hamburger menu collapses center links

### 4.2 `LandingHero.vue`
- **Layout:** 2-column grid on desktop (`lg:grid-cols-2`), stacked on mobile
- **Left column:**
  - Badge pill: "✨ Sistem Absensi Digital SMTI Jogja" (yellow bg, dark text)
  - `<h1>`: "Gerbang Akses Pintar dan Kehadiran" — large, extrabold
  - Subtext: "Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat."
  - CTA row: **"Mulai Sekarang →"** (solid yellow button) + **"Pelajari Lebih Lanjut"** (ghost/outline button)
- **Right column:** CSS animation widget:
  - Large circle with pulsing yellow ring (`animate-ping` layered) + fingerprint icon (`mingcute:fingerprint-line`) centered
  - 3 small dots orbiting the circle (CSS `@keyframes orbit`)
  - Floating card below: "✅ Hadir — Budi Santoso | 07:32" — glassmorphism style, floats with `animate-float` (custom keyframe, gentle y-axis movement)
- **Background:** Subtle dot-grid pattern via CSS `background-image: radial-gradient(...)` + yellow blob in top-right corner (low opacity, `blur-3xl`)

### 4.3 `LandingFeatures.vue`
- Section heading: "Kenapa GASKAN?" centered
- **4 feature cards** in a responsive grid (`sm:grid-cols-2 lg:grid-cols-4`):
  | Icon | Title | Description |
  |------|-------|-------------|
  | 📍 `mingcute:location-line` | Absensi Real-time | Catat kehadiran siswa secara langsung tanpa penundaan |
  | 📊 `mingcute:chart-bar-line` | Rekap Otomatis | Laporan kehadiran tersusun rapi dan dapat diunduh kapan saja |
  | 👁️ `mingcute:eye-line` | Monitor Kehadiran | Pantau status kehadiran seluruh siswa dalam satu dashboard |
  | 🔐 `mingcute:lock-line` | Akses Multi-Role | Sistem hak akses terpisah untuk siswa, admin, dan developer |
- Card style: rounded-2xl, border `1px`, hover `scale-105` + `shadow-lg` transition
- Each card has a colored icon container (yellow tinted background circle)

### 4.4 `LandingStats.vue`
- Section heading: "GASKAN dalam Angka" centered
- **4 stat items** in a row (`grid-cols-2 lg:grid-cols-4`):
  | Value | Label |
  |-------|-------|
  | 500+ | Siswa Terdaftar |
  | 99.9% | Uptime Sistem |
  | 3 | Role Pengguna |
  | 1 | Sekolah Terhubung |
- Count-up animation: numbers animate from 0 to target when section enters viewport (using `useIntersectionObserver` + `useInterval` from VueUse)
- Background: slightly different from page bg to create visual separation (use `bg-base-200` equivalent for current theme)

### 4.5 `LandingFAQ.vue`
- Section heading: "Pertanyaan Umum" + subtitle
- **5 FAQ items** as accordion (using DaisyUI `collapse` component):
  1. Q: "Apa itu GASKAN?" — A: Sistem manajemen kehadiran digital untuk SMTI Jogja
  2. Q: "Siapa yang bisa menggunakan GASKAN?" — A: Siswa, admin sekolah, dan developer sistem
  3. Q: "Apakah data kehadiran aman?" — A: Data disimpan di server yang aman dengan enkripsi
  4. Q: "Bagaimana cara login?" — A: Gunakan NIS dan password yang diberikan oleh admin sekolah
  5. Q: "Apakah GASKAN gratis?" — A: Ya, GASKAN adalah sistem internal SMTI Jogja tanpa biaya

### 4.6 `LandingFooter.vue`
- Simple single-row footer
- Left: "© 2025 GASKAN — SMTI Jogja"
- Right: "Dibuat dengan ❤️ oleh Tim Developer SMTI Jogja"
- Top border separator

---

## 5. Theme System

### `composables/useTheme.ts`
```typescript
// Uses VueUse useStorage to persist preference
const theme = useStorage('gaskan-theme', 'mytheme') // 'mytheme' = dark
// Applies data-theme attribute to document.documentElement
// Exposed: { theme, toggleTheme, isDark }
```

### New DaisyUI theme tokens in `tailwind.css`
Add `[data-theme="mytheme-light"]` with:
- `--b1`: warm cream background
- `--b2`: white surface
- `--bc`: dark text (inverse of dark theme)
- Keep `--p` (primary yellow) identical in both themes

### Theme toggle behavior
- Applied on `<html>` or the root `<div data-theme>` in `app.vue`
- Icon animates: sun rotates in from left (light mode), moon slides in (dark mode)
- localStorage key: `gaskan-theme`

---

## 6. SEO

Keep existing `useSeoMeta` config in `pages/index.vue`. No changes needed.

---

## 7. What Is NOT Changing

- All other pages (`/login`, `/home`, `/siswa/**`, etc.) — untouched
- App-level `data-theme` attribute in `app.vue` — will be made reactive to `useTheme`
- Existing color tokens in `tailwind.css` — only additions, no removals
- Auth flow, API, store logic — untouched

---

## 8. Success Criteria

- [ ] Landing page renders correctly in both dark and light mode
- [ ] Theme toggle persists across page refreshes (localStorage)
- [ ] All 6 sections present: Navbar, Hero, Features, Stats, FAQ, Footer
- [ ] CSS animations work: pulse ring, orbit dots, floating card
- [ ] Count-up animation triggers on scroll into Stats section
- [ ] "Masuk" button navigates to `/login`
- [ ] Smooth scroll to anchor sections works (Fitur, Statistik, FAQ)
- [ ] Responsive: mobile layout stacks correctly
- [ ] No breaking changes to other pages
