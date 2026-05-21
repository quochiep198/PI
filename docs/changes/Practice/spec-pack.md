# Practice Daily — Spec Pack

> Tạo: 2026-05-19 · Cập nhật: 2026-05-19
> **Tài liệu mô tả hiện trạng Practice Daily page.**

---

## 1. Tổng quan

Practice Daily là trang chính để người dùng luyện tập Python hàng ngày. Trang hiển thị chuỗi ngày học (streak) với tính năng check-in, các thử thách hàng ngày, cửa hàng đổi quà, và bảng xếp hạng.

---

## 2. Cấu trúc trang (Shared Layout)

```
+---------------------------------------------------------------------+
|  [TOPBAR]  PythonQuest    [XP] [Coins] [Avatar] [Logout]           |
+----------+----------------------------------------------------------+
| [SIDENAV]|  [MAIN CONTENT]                                       |
|          |                                                        |
| Online   |  +-- Streak Calendar (Interactive) ------------------+  |
| 12 users |  |  Chuỗi ngày rực rỡ  [🔥] 12 Ngày               |  |
|          |  |  [Check-in button / Complete state]               |  |
| [Nav]    |  |  T2  T3  T4(Today)  T5  T6  T7  CN           |  |
| Lessons  |  +----------------------------------------------------+  |
| Daily *  |                                                        |
| Play     |  +-- Challenges --------------------------------------+ |
| Achiev   |  |  [Icon] Name        Diff  Reward  [Start]       | |
| Settings |  |  ...                                              | |
|          |  +----------------------------------------------------+ |
| Upgrade  +----------------------------------------------------------+
| Pro      |  [SIDEBAR]                                             |
|          |  +-- Leaderboard -------------------------------------+ |
|          |  |  ...                                              | |
|          |  +---------------------------------------------------+ |
|          |  +-- Tip Widget ------------------------------------+ |
|          |  |  ...                                              | |
|          |  +---------------------------------------------------+ |
+----------+
|  [MOBILE NAV]                                                    |
+---------------------------------------------------------------------+
```

**Lưu ý:** TopBar và SideNav được render trong `App.tsx`, không phải trong PracticePage.

---

## 3. Shared Layout Architecture

### 3.1 TopBar (features/layout/TopBar.tsx)

Shared header cho cả Home và Practice pages.

**Props:**
```typescript
type TopBarProps = {
  user: AuthUser;
  xpData: XpLevel;
  coins?: number;
  onLogout: () => Promise<void> | void;
};
```

**Elements:**
| Element | Class | Mô tả |
|---------|-------|-------|
| Brand | topbar__brand / topbar__title | "PythonQuest" |
| Welcome | topbar__welcome | username |
| XP | practice-topbar__coins | icon `social_leaderboard` + "{totalXp} XP" |
| Coins | practice-topbar__coins | icon `monetization_on` + value |
| Star | topbar__star | star icon (decorative) |
| Avatar | topbar__avatar | user avatar hoặc default |
| Logout | topbar__logout | "Đăng xuất" |

### 3.2 SideNav (features/layout/SideNav.tsx)

Shared sidebar cho cả Home và Practice pages.

**Props:**
```typescript
type SideNavProps = {
  activeLabel?: string;
  onlineCount?: number;
  onlineLoading?: boolean;
  onlineError?: boolean;
  onNavigateLessons?: () => void;
  onNavigatePractice?: () => void;
};
```

**Elements:**
| Element | Class | Mô tả |
|---------|-------|-------|
| Online status | online-status | Dot indicator + "X người học online" |
| Nav buttons | sidenav__nav | 5 buttons: Lessons, Daily Practice, Playground, Achievements, Settings |
| Upgrade | upgrade-card | Nút "Nâng cấp Pro" |

**Note:** Không còn XpBar - XP được hiển thị trong TopBar.

---

## 4. PracticePage Components

PracticePage là component chỉ chứa content, không render layout (layout nằm trong App.tsx).

### 4.1 PracticePage (PracticePage.tsx)

**Props:**
```typescript
type PracticePageProps = {
  user: AuthUser;
};
```

### 4.2 StreakCalendar Components

```
practice/components/
├── StreakCalendar.tsx    # Main component
├── DayCell.tsx           # Individual day cell
├── CelebrationModal.tsx   # Check-in celebration modal
├── api/
│   └── streakApi.ts       # API functions + mock
├── hooks/
│   └── useStreak.ts       # useStreak hook
└── types/
    └── streak.ts          # Streak types
```

---

## 5. Streak Calendar (Interactive)

### 5.1 StreakCalendar

**Props:**
```typescript
type StreakCalendarProps = {
  userId: number;
};
```

**States:**
- `idle` - Initial/ready state
- `loading` - Loading streak data
- `success` - Data loaded successfully
- `error` - Error loading data

**Features:**
1. Check-in button - Nhấn để check-in ngày hôm nay
2. Streak badge với animation fire khi streak >= 7
3. Loading spinner khi đang check-in
4. Completion state khi đã check-in hôm nay
5. Info: streak dài nhất và tổng check-in

### 5.2 DayCell

**Trạng thái ngày:**
| State | Class | Background | Icon |
|-------|-------|------------|------|
| completed | `--done` | secondary-container | local_fire_department (FILL) |
| today (chưa check-in) | `--today` + `--can-checkin` | primary + pulse | star |
| today (đã check-in) | `--today` | primary | local_fire_department |
| locked | `--locked` | surface-container | lock |
| future | `--future` | surface-container-high | radio_button_unchecked |

**Animations:**
- `pulse-glow` - Glow effect khi có thể check-in
- `bounce-icon` - Icon bounce animation
- `pulse-ring` - Check-in ready indicator

### 5.3 CelebrationModal

**Props:**
```typescript
type CelebrationModalProps = {
  isOpen: boolean;
  streak: number;
  reward: number;
  achievement?: string;
  onClose: () => void;
};
```

**Features:**
1. Confetti animation với 50 particles
2. Display streak numbers và rewards
3. Achievement display cho milestone (7, 14, 30, 100)
4. Auto-close sau 4 giây
5. Backdrop blur effect

### 5.4 Streak API (streakApi.ts)

```typescript
// Functions
fetchStreakData(userId: number): Promise<StreakData>
checkIn(userId: number): Promise<CheckInResult>

// Mock data response
{
  currentStreak: 12,
  longestStreak: 45,
  lastCheckIn: "2026-05-18",
  weekDays: [...],
  totalCheckIns: 87,
  isCheckedInToday: false
}
```

### 5.5 useStreak Hook

```typescript
type UseStreakReturn = {
  streakData: StreakData | null;
  state: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  checkIn: () => Promise<CheckInResult | null>;
  refetch: () => Promise<void>;
};
```

### 5.6 thiết lập quan hệ giữa user và Streak
- Nếu user đã Streak rồi thì sẽ không được Streak lại dù có reload lại page
- Tạo bảng quan hệ giữa Streak à User
- Nếu user đã Streak rồi thì phải cập nhật coin liền, không phải reload lại mới cập nhật

---

## 6. Challenges Section

3 challenge cards với:

**Icon Colors:**
| Modifier | Màu | Icon |
|----------|-----|------|
| `--primary` | primary (xanh dương) | smart_toy |
| `--secondary` | secondary (vàng) | diamond |
| `--error` | error (đỏ) | bug_report |

**Difficulty badges:**
| Modifier | Màu |
|----------|-----|
| `--easy` | tertiary (xanh lá) |
| `--medium` | cam |
| `--hard` | đỏ |

---

## 7. Store Section

Grid 3 columns. Items có badge "MỚI!" cho item featured.
- Item hover: shadow tăng từ 4px → 8px
- Image hover: scale 1.1

---

## 8. Leaderboard

4 user entries:
- Top 3 với rank badge colors: vàng (1), bạc (2), đồng (3)
- User row: dashed border, highlight background

---

## 9. Responsive Breakpoints

| Breakpoint | Thay đổi |
|------------|----------|
| <=1200px | Sidebar width: 320px, Streak day: 48px |
| <=1024px | Main content: 1 column, sidebar moves to top horizontal scroll |
| <=768px | SideNav hidden, mobile nav visible, single column layout |

---

## 10. Animation & Effects

| Element | Animation |
|---------|-----------|
| `.streak-fire` | scale(1→1.1) + drop-shadow, 1.5s infinite alternate |
| `.practice-challenge-card:hover` | translateX(8px) |
| `.practice-store__item:hover` | shadow 4px→8px |
| `.practice-store__item-image img:hover` | scale(1.1) |
| `.pressable:active` | translate(2px, 2px), box-shadow none |
| `.celebrate-bounce` | scale bounce cho celebration icon |
| `.confetti-fall` | confetti particles falling |
| `pulse-glow` | glow pulse cho ngày có thể check-in |

---

## 11. CSS Classes Overview

### Shared Layout (features/layout/)
- `.topbar` — shared header container
- `.topbar__brand`, `.topbar__profile` — header sections
- `.practice-topbar__coins` — XP and coins display
- `.sidenav` — shared sidebar container
- `.online-status` — online indicator
- `.upgrade-card` — Pro upgrade CTA

### Practice Content
- `.practice-main` — main scrollable area
- `.practice-content` — grid 2 columns (1fr 380px)
- `.practice-streak` — streak calendar section
- `.practice-challenges` — challenges list
- `.practice-store` — rewards store grid
- `.practice-sidebar` — right column (leaderboard + tip)

### Celebration
- `.celebration-modal` — modal overlay
- `.celebration-modal__card` — modal card
- `.celebration-confetti` — confetti container

---

## 12. File Structure

```
src/
├── App.tsx                    # Renders: TopBar, SideNav, view switching
├── features/
│   ├── layout/               # SHARED LAYOUT COMPONENTS
│   │   ├── TopBar.tsx        # Shared header
│   │   ├── SideNav.tsx       # Shared sidebar
│   │   └── index.ts
│   ├── home/
│   │   └── HomePage.tsx      # Content only
│   ├── practice/              # Practice components
│   │   ├── PracticePage.tsx    # Content only (no layout)
│   │   ├── components/
│   │   │   ├── StreakCalendar.tsx
│   │   │   ├── DayCell.tsx
│   │   │   └── CelebrationModal.tsx
│   │   ├── api/
│   │   │   └── streakApi.ts
│   │   ├── hooks/
│   │   │   └── useStreak.ts
│   │   └── types/
│   │       └── streak.ts
│   ├── auth/
│   │   └── types.ts          # AuthUser with avatarUrl
│   └── navigate/
│       └── NavigateNavigation.tsx  # MobileNavigation
```

---

## 13. Type Definitions

### AuthUser
```typescript
type AuthUser = {
  id: number;
  email: string;
  username: string;
  isPro?: boolean;
  avatarUrl?: string;
};
```

### XpLevel
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

### StreakData
```typescript
type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  weekDays: StreakDay[];
  totalCheckIns: number;
  isCheckedInToday: boolean;
};

type StreakDay = {
  date: string;
  label: string;
  status: 'completed' | 'today' | 'locked' | 'future';
  isToday: boolean;
  dayOfWeek: number;
};

type CheckInResult = {
  success: boolean;
  newStreak: number;
  reward: number;
  achievement?: string;
  message: string;
};
```

---

## 14. Open Issues

| # | Question | Status |
|---|----------|--------|
| 1 | Challenge buttons cần navigate đến đâu? | Pending |
| 2 | Store items có real buy flow chưa? | No |
| 3 | Leaderboard data từ API hay mock? | Mock |
| 4 | Tip content có dynamic không? | No (static) |
| 5 | Streak check-in có nhận reward thực sự? | Mock (coins tăng tượng trưng) |

---

## 15. Tham khảo

- Design System: docs/raw/design/Practice/DESIGN.md
- Global CSS: src/styles/global.css (lines ~1691-2000)
- Frontend Rules: .codex/rules/frontend.md