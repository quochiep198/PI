# Practice Daily — Spec Pack

> Tạo: 2026-05-19 · Giai đoạn: Hoàn thành (Current Implementation)
> **Tài liệu mô tả hiện trạng Practice Daily page. Dùng để tham chiếu khi phát triển tính năng mới.**

---

## 1. Tổng quan

Practice Daily là trang chính để người dùng luyện tập Python hàng ngày. Trang hiển thị chuỗi ngày học (streak), các thử thách hàng ngày, cửa hàng đổi quà, và bảng xếp hạng.

---

## 2. Cấu trúc trang

```
+---------------------------------------------------------------------+
|  [TOPBAR]  PythonQuest    [User] [Coins] [Avatar] [Logout]          |
+----------+----------------------------------------------------------+
| [SIDENAV]|  [MAIN CONTENT - practice-main]                          |
|          |                                                          |
| [XP BAR] |  +-- Streak Calendar ---------------------------------+ |
| Lv.X     |  |  Chuỗi ngày rực rỡ  [🔥] 12 Ngày                  | |
| Name     |  |  T2  T3  T4(Today)  T5  T6  T7  CN                  | |
| [====]   |  |  [=] [=] [=]       [ ] [ ] [ ]  [ ]               | |
|          |  +----------------------------------------------------+ |
| Online   |                                                          |
| 12 users |  +-- Challenges --------------------------------------+ |
|          |  |  [Icon] Name        Diff  Reward  [Start]         | |
| [Nav]    |  |  [Icon] Name        Diff  Reward  [Start]         | |
| Lessons  |  |  [Icon] Name        Diff  Reward  [Start]         | |
| Daily    |  +----------------------------------------------------+ |
| Play     |                                                          |
| Achiev   |  +-- Store ------------------------------------------+ |
| Settings |  |  [Item]  [Item]  [Item]                            | |
|          |  +----------------------------------------------------+ |
| Upgrade  +----------------------------------------------------------+
| Pro      |  [SIDEBAR]                                               |
|          |  +-- Leaderboard -------------------------------------+ |
|          |  |  1. Avatar  Name      Zone       XP                | |
|          |  |  2. Avatar  Name      Zone       XP                | |
|          |  |  3. Avatar  Name      Zone       XP                | |
|          |  |  --------------------------------                | |
|          |  |  [You]  Bạn (Junior)    Tiến lên  1,250            | |
|          |  |  [View All]                                   | |
|          |  +---------------------------------------------------+ |
|          |  +-- Tip Widget ------------------------------------+ |
|          |  |  [LIGHTBULB] Mẹo nhỏ                             | |
|          |  |  Hoàn thành thử thách trước 12h để X2 XP         | |
|          |  +---------------------------------------------------+ |
+----------+
|  [MOBILE NAV]  Lessons  Playground  Achievements  Profile          |
+---------------------------------------------------------------------+
```

---

## 3. Components

### 3.1 PracticePage (PracticePage.tsx)

Props:
```typescript
type PracticePageProps = {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
  onNavigateHome: () => void;
};
```

### 3.2 PracticeHeader (PracticeHeader.tsx)

Layout: flexbox horizontal, space-between

Elements:
| Element | Class | Noi dung mau |
|---------|-------|--------------|
| Brand | topbar__brand / topbar__title | "PythonQuest" |
| Welcome | topbar__welcome | username |
| Coins | practice-topbar__coins | icon + "1,250" |
| Star | topbar__star | star icon |
| Avatar | topbar__avatar | ảnh user |
| Logout | topbar__logout | "Đăng xuất" |

### 3.3 PracticeSideNav (PracticeSideNav.tsx)

Elements:
| Element | Class | Mo ta |
|---------|-------|-------|
| XpBar | xp-bar | Hiển thị level, progress, XP |
| Online status | online-status | Dot xanh + "12 người học online" |
| SideNavigation | sidenav__nav | 5 items |
| Upgrade | upgrade-card | Nút "Nâng cấp Pro" |

### 3.4 PracticeMain Content

#### 3.4.1 Streak Section (practice-streak)

**Wireframe ASCII:**
```
+-----------------------------------------------------------------------+
|  Chuỗi ngày rực rỡ                              [🔥] 12 Ngày         |
|-----------------------------------------------------------------------|
|  T2      T3      T4      T5      T6      T7      CN                    |
|  [🔥]   [🔥]   [⭐]   [🔒]   [🔒]   [🔒]   [🔒]                       |
|                 (●)                                                    |
+-----------------------------------------------------------------------+
```

**Container Styles:**
| Property | Value |
|----------|-------|
| Class | .practice-streak |
| padding | 32px |
| background | var(--color-surface-container-lowest) #ffffff |
| border | 2px solid var(--color-surface-container) #eeeef0 |
| border-radius | 32px |
| box-shadow | 8px 8px 0 0 rgba(238, 238, 240, 1) |

**Header (.practice-streak__header):**
| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| justify-content | space-between |
| margin-bottom | 32px |

**Title (.practice-streak__title):**
| Property | Value |
|----------|-------|
| font-size | 28px |
| font-weight | 700 |
| margin | 0 |

**Badge (.practice-streak__badge):**
| Property | Value |
|----------|-------|
| display | flex, align-items: center, gap: 8px |
| padding | 8px 16px |
| color | var(--color-on-error-container) #93000a |
| background | var(--color-error-container) #ffdad6 |
| border | 2px solid rgba(186, 26, 26, 0.2) |
| border-radius | 999px |
| font-weight | 700 |

**Fire Icon Animation:**
- Classes: .practice-streak__fire + .streak-fire
- Animation name: flicker
- Duration: 1.5s
- Timing: infinite alternate
- Keyframes:
  - 0%: transform scale(1), filter drop-shadow(0 0 2px #ffde59)
  - 100%: transform scale(1.1), filter drop-shadow(0 0 8px #ffde59)
- Material Symbols: fill = FILL 1 (filled icon)

**Calendar Grid (.practice-streak__calendar):**
| Property | Value |
|----------|-------|
| display | grid |
| grid-template-columns | repeat(7, 1fr) |
| gap | 16px |

**Day Cell (.practice-streak__day):**
| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| align-items | center |
| gap | 12px |

**Day Label (.practice-streak__day-label):**
| Property | Value |
|----------|-------|
| font-weight | 700 |
| color | var(--color-on-surface-variant) #444655 |
| Labels | T2, T3, T4, T5, T6, T7, CN |

**Day Box (.practice-streak__day-box):**
| Property | Value |
|----------|-------|
| width | 56px |
| height | 56px |
| display | flex, align-items: center, justify-content: center |
| border-radius | 16px |
| position | relative |
| icon size | 28px |

**Trạng thái ngày:**

| State | Class Modifier | Background | Border Bottom | Shadow | Icon | Icon Color |
|-------|----------------|------------|---------------|--------|------|------------|
| Đã hoàn thành | --done | secondary-container (#ffde59) | 4px solid #b29400 | 0 4px 0 0 #756100 | local_fire_department | on-secondary-container (#756100), FILL=1 |
| Hôm nay | --today | primary (#3045e3) | 4px solid #1a2bb3 | 0 4px 0 0 #0e29cf | star | white |
| Locked | --locked | surface-container (#eeeef0) | 4px solid outline-variant (#c5c5d8) | none | lock | outline (#757687), size: 24px |

**Today Cell Modifiers:**
- .practice-streak__day--today -> transform: scale(1.1)
- .practice-streak__day--locked -> opacity: 0.4
- .practice-streak__day--today .practice-streak__day-label -> color: var(--color-primary) #3045e3

**Today Indicator Dot (.practice-streak__day-today-dot):**
| Property | Value |
|----------|-------|
| width | 12px |
| height | 12px |
| background | var(--color-error) #ba1a1a |
| border | 2px solid white |
| border-radius | 999px |
| position | absolute |
| top | -4px |
| right | -4px |

**Responsive Breakpoints:**
| Breakpoint | Day Box | Gap | Icon Size |
|------------|---------|-----|-----------|
| <=1200px | 48x48px | 12px | default |
| <=768px | 40x40px | 8px | 20px !important |

**Mock Data:**
| Property | Value |
|----------|-------|
| Current streak | 12 ngày |
| Week days | T2, T3, T4 (today), T5, T6, T7, CN |
| Completed days | T2, T3 |
| Today | T4 |
| Locked days | T5, T6, T7, CN |

**Props Interface (khi can mở rộng):**
```typescript
type StreakCalendarProps = {
  currentStreak: number;
  weekDays: Array<{
    label: string; // "T2", "T3", ...
    status: 'completed' | 'today' | 'locked' | 'future';
  }>;
  onDayClick?: (dayIndex: number) => void;
};
```

**Open Issues:**
| # | Question | Status |
|---|----------|--------|
| 1 | Click vào ngày có trigger action không? | Chưa - chi hiển thị |
| 2 | Streak data từ API hay mock? | Mock hiện tại |
| 3 | Badge "12 Ngày" có dynamic không? | Không - static |
| 4 | Future days có hiển thị locked không? | Có, opacity 0.4 |

#### 3.4.2 Challenges Section (practice-challenges)

3 challenge cards với:

**Icon Colors:**
| Modifier | Mau | Icon |
|----------|-----|------|
| practice-challenge-card__icon--primary | primary (xanh duong) | smart_toy |
| practice-challenge-card__icon--secondary | secondary (vàng) | diamond |
| practice-challenge-card__icon--error | error (đỏ) | bug_report |

**Difficulty badges:**
| Modifier | Mau |
|----------|-----|
| practice-challenge-card__difficulty--easy | tertiary (xanh lá) |
| practice-challenge-card__difficulty--medium | cam |
| practice-challenge-card__difficulty--hard | đỏ |

#### 3.4.3 Store Section (practice-store)

Grid 3 columns. Items có badge "MỚI!" cho item featured.
Item hover: shadow tang tu 4px → 8px, image scale 1.1.
Featured item: 4px top border secondary-container.

#### 3.4.4 Sidebar - Leaderboard (practice-leaderboard)

4 user entries:
- Top 3 với rank badge colors: vàng (1), bac (2), đồng (3)
- User row: dashed border, highlight background

Rank badge modifiers:
| Modifier | Mau |
|----------|-----|
| practice-leaderboard__item-rank-num--silver | #cbd5e1 |
| practice-leaderboard__item-rank-num--bronze | #fdba74 |
| practice-leaderboard__item-rank-num--user | primary |

#### 3.4.5 Tip Widget (practice-tip)

Background: tertiary-container. Icon to 128px, opacity 0.15, rotate 12deg.

---

## 4. Responsive Breakpoints

| Breakpoint | Thay đổi |
|------------|----------|
| <=1200px | Sidebar width: 320px |
| <=1024px | Main content: 1 column, sidebar moves to top horizontal scroll |
| <=768px | SideNav: hidden, mobile nav visible, single column layout |

---

## 5. Du lieu tinh (Mock)

### Streak
- Current streak: 12 ngày
- Tuần hiện tại: T2-CN, T4 là hôm nay

### Challenges
| Tên | Icon | Do kho | Phan thuong |
|-----|------|--------|------------|
| Giải cuu Py-Bot | smart_toy | Dễ | +50 |
| Thu thap kim cuong | diamond | Trung binh | +120 |
| Sua loi ma nguon | bug_report | Kho | +250 |

### Store Items
| Tên | Gia | Badge |
|-----|-----|-------|
| Mu Quy Toc | 450 | MỚI! |
| Kinh Cyber | 800 | featured |
| Balo Ten Lua | 1,200 | - |

### Leaderboard
| Rank | Tên | Zone | XP |
|------|-----|------|----|
| 1 | Minh Anh | Lâu đài Python | 4,250 |
| 2 | Bao Nam | Thung lũng Loop | 3,980 |
| 3 | Linh Chi | Rừng Biến so | 3,720 |
| You | Junior Coder | Tiến lên nào! | 1,250 |

---

## 6. Navigation Flow

```
PracticePage
├── PracticeHeader (static)
├── PracticeSideNav
│   └── SideNavigation
│       ├── Lessons → onNavigateHome (prop)
│       ├── Daily Practice (active)
│       ├── Playground
│       ├── Achievements
│       └── Settings
├── PracticeMain
│   ├── practice-streak
│   ├── practice-challenges → buttons (onClick handlers needed)
│   ├── practice-store → item buttons (onClick handlers needed)
│   └── practice-sidebar
│       ├── practice-leaderboard → view all button
│       └── practice-tip
└── MobileNavigation (hidden on desktop)
```

---

## 7. Props & Types

### AuthUser
```typescript
type AuthUser = {
  id: number;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};
```

### XpLevel (from useXP)
```typescript
type XpLevel = {
  level: number;
  name: string;
  totalXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  currentXp: number;
};
```

---

## 8. CSS Classes Overview

### Layout
- .quest-page — container chính
- .quest-layout — flex row (sidenav + main)
- .practice-main — main scrollable area
- .practice-content — grid 2 columns (1fr 380px)

### Sidenav (left)
- .sidenav — left sidebar container
- .xp-bar — XP progress bar
- .online-status — online indicator
- .upgrade-card — Pro upgrade CTA

### Main Sections
- .practice-streak — streak calendar section
- .practice-challenges — challenges list
- .practice-store — rewards store grid
- .practice-sidebar — right column (leaderboard + tip)

### Components
- .practice-challenge-card — challenge item
- .practice-store__item — store item
- .practice-leaderboard — leaderboard widget
- .practice-leaderboard__item — leaderboard row
- .practice-leaderboard__user — current user row
- .practice-tip — tip widget

### Mobile Nav
- .mobile-nav — bottom fixed nav (hidden on desktop)

---

## 9. Animation & Effects

| Element | Animation |
|---------|-----------|
| .streak-fire | scale(1 → 1.1) + drop-shadow pulse, 1.5s infinite alternate |
| .practice-challenge-card:hover | translateX(8px) |
| .practice-store__item:hover | shadow 4px → 8px |
| .practice-store__item-image img:hover | scale(1.1) |
| .pressable:active | translate(2px, 2px), box-shadow none |

---

## 10. Icons (Material Symbols)

| Icon | Usage |
|------|-------|
| local_fire_department | Streak, completed days |
| star | Today, coins |
| lock | Locked days |
| smart_toy | Easy challenge |
| diamond | Medium challenge |
| bug_report | Hard challenge |
| monetization_on | Coins, rewards |
| leaderboard | Leaderboard header |
| lightbulb | Tip widget background icon |
| menu_book | Lessons nav |
| event_repeat | Daily Practice nav |
| code | Playground nav |
| military_tech | Achievements nav |
| settings | Settings nav |

---

## 11. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Challenge buttons cần navigate đến đâu? | Pending |
| 2 | Store items có real buy flow chưa? | No |
| 3 | Leaderboard data từ API hay mock? | Mock |
| 4 | Tip content có dynamic không? | No (static) |
| 5 | Streak calendar có chức năng check-in không? | No (display only) |

---

## 12. Mối quan he file

```
src/features/
├── practice/
│   ├── index.ts              # Export PracticePage
│   ├── PracticePage.tsx      # Main container
│   ├── PracticeHeader.tsx    # Topbar
│   └── PracticeSideNav.tsx   # Left sidebar
├── navigate/
│   ├── NavigateNavigation.tsx # SideNavigation, MobileNavigation
│   └── navigation.ts         # Nav items data
├── auth/
│   └── types.ts             # AuthUser type
└── home/
    ├── components/
    │   └── XpBar.tsx         # XP progress bar component
    └── useXPCached.ts        # XP data hook
```

---

## 13. Tham chieu

- Design System: docs/raw/design/Practice/DESIGN.md
- Global CSS: src/styles/global.css (lines 1691-1880)