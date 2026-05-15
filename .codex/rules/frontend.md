# Frontend Code Rules

## Project Structure

### File Organization
```
src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── content/
│   ├── messages.ts            # All UI text/messages in Vietnamese
│   └── starterModules.ts      # Initial Python code templates
└── features/
    ├── auth/
    │   ├── AuthPage.tsx       # Login/Register page
    │   ├── authApi.ts         # Auth API calls
    │   ├── types.ts           # Auth type definitions
    │   └── useAuthForm.ts     # Auth form hook
    ├── home/
    │   ├── HomePage.tsx       # Main learning interface
    │   ├── index.ts           # Feature exports
    │   ├── useLessons.ts      # Lessons data hook
    │   ├── useLessonProgress.ts
    │   ├── useOnlineLearners.ts
    │   ├── usePyodideRunner.ts
    │   └── components/
    │       ├── LessonPanel.tsx
    │       ├── WorkspacePanel.tsx
    │       ├── HomeHeader.tsx
    │       ├── HomeSideNav.tsx
    │       └── index.ts
    └── navigate/
        ├── NavigateNavigation.tsx
        ├── navigation.ts
        └── index.ts
```

### Directory Conventions
- Each feature has its own folder under `features/`
- Feature folders contain: main component, hooks, API calls, types, and sub-components
- Shared utilities go in the feature that owns them
- Components are grouped in `components/` subfolder if there are more than 2

## TypeScript Conventions

### Type Definitions
```typescript
// types.ts - collocate related types with their feature
export type AuthUser = {
  id: number;
  username: string;
  email: string;
  isPro?: boolean;
};

// Use union types for states
type LoadingState = 'idle' | 'loading' | 'error' | 'success';

// Use TypeScript union types for enum-like values
type OutputTone = 'idle' | 'success' | 'error';
```

### Naming Conventions
- Types: PascalCase (e.g., `AuthUser`, `Lesson`, `RuntimeFeedback`)
- Interfaces for objects that may be extended: prefix with `I` only if ambiguous
- Custom hooks: camelCase starting with `use` (e.g., `useLessons`, `useAuthForm`)
- Event handlers: `handle` prefix (e.g., `handleRunCode`, `handleLessonSelect`)
- Boolean variables: `is`, `has`, `can`, `should` prefix (e.g., `isProUser`, `hasError`)

## React Patterns

### Hook Usage
```typescript
// Prefer custom hooks for business logic
const { lessons, loading, error } = useLessons();

// Use useMemo for expensive computations
const filteredLessons = useMemo(
  () => lessons.filter((lesson) => lesson.track === selectedTrack),
  [lessons, selectedTrack],
);

// Use useCallback for callbacks passed to child components
const handleLessonSelect = useCallback((lesson: Lesson) => {
  setSelectedLessonId(lesson.id);
}, []);
```

### Component Structure
```typescript
// Props interface at top
type LessonPanelProps = {
  lessons: Lesson[];
  completedLessonIds: number[];
  selectedLessonId: number | null;
  onLessonSelect: (lesson: Lesson) => void;
};

// Export as named export
export function LessonPanel({ lessons, onLessonSelect }: LessonPanelProps) {
  // Hooks first
  const [isOpen, setIsOpen] = useState(false);

  // Then handlers
  function handleToggle() {
    setIsOpen(prev => !prev);
  }

  // Then render
  return (
    <div className="lesson-panel">
      {/* JSX */}
    </div>
  );
}
```

### State Management
- Local state: `useState` for component-specific state
- Shared state: lift state to parent and pass via props
- Avoid prop drilling beyond 2 levels - use Context or lift state
- Group related state into objects to reduce state variables

## API Calls

### Pattern for API Calls
```typescript
// Feature-specific API file (e.g., authApi.ts)
import type { AuthUser } from './types';

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function login(identifier: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await readJsonSafely<{ user: AuthUser; message?: string }>(response);

  if (!response.ok) {
    throw new Error(data?.message || 'Đăng nhập thất bại.');
  }

  return data?.user;
}
```

### Error Handling
```typescript
// Always handle errors and show user-friendly messages
async function fetchData() {
  try {
    setIsLoading(true);
    const result = await apiCall();
    setData(result);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi.');
  } finally {
    setIsLoading(false);
  }
}
```

## User-Facing Text (messages.ts)

### All UI text MUST be in `src/content/messages.ts`
```typescript
export const VI_MESSAGES = {
  // Group by feature
  auth: {
    labels: {
      email: 'Email',
      // ...
    },
    errors: {
      invalidCredentials: 'Email hoặc mật khẩu không đúng.',
      // ...
    },
  },
  home: {
    labels: {
      logout: 'Đăng xuất',
      // ...
    },
    output: {
      // Messages shown to users
    },
  },
} as const;
```

### Never hardcode Vietnamese text in components
```typescript
// Bad
return <span>Email không hợp lệ</span>;

// Good
return <span>{VI_MESSAGES.auth.errors.invalidEmail}</span>;
```

## Styling

### CSS Classes (from index.css)
- Use semantic class names: `.quest-page`, `.lesson-panel`, `.workspace-editor`
- Avoid inline styles except for dynamic values
- Use utility classes for spacing adjustments
- Mobile-first responsive design

### Class Naming
- Block: `.component-name`
- Element: `.component-name__element`
- Modifier: `.component-name--variant`

## Code Formatting

### Import Order
```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. External libraries
import { vi } from 'date-fns/locale';

// 3. Internal features
import { login } from '../auth/authApi';
import type { AuthUser } from '../auth/types';

// 4. UI components
import { Button } from './components/Button';

// 5. Assets and styles
import './styles.css';
```

### React Fragment
- Use `<></>` for rendering multiple elements without wrapper
- Use `React.Fragment` only when you need `key` prop

### Arrow Functions for Simple Callbacks
```typescript
// Preferred for simple renders
lessons.map((lesson) => (
  <LessonItem key={lesson.id} lesson={lesson} />
));

// Use regular function for complex logic
lessons.filter((lesson) => {
  const isCompleted = completedIds.includes(lesson.id);
  return isCompleted && lesson.track === selectedTrack;
});
```

## Common Patterns

### Pyodide Integration (usePyodideRunner)
```typescript
export function usePyodideRunner() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [startupMessage, setStartupMessage] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);

  // ... implementation
}
```

### Local Storage Pattern
```typescript
const STORAGE_KEY = 'python-adventure.home-editor-code';

function normalizeCode(value: string | null) {
  if (!value) return DEFAULT_CODE;
  return value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function getInitialCode() {
  if (typeof window === 'undefined') return DEFAULT_CODE;
  return normalizeCode(window.localStorage.getItem(STORAGE_KEY));
}
```

## Performance Considerations

### Avoid Unnecessary Re-renders
- Memoize expensive computations with `useMemo`
- Wrap callback props with `useCallback`
- Use `React.memo` for pure presentational components

### Lazy Loading
- Use `React.lazy` for routes/components that aren't immediately needed
- Pyodide loads on demand (when user clicks Run)

## Testing
- Test custom hooks in isolation
- Mock API calls in component tests
- Focus on user interaction flows