# laint

AI Agent Lint Rules SDK - a simple programmatic API for linting JSX/TSX code.

## Installation

```bash
npm install laint
```

## Usage

```typescript
import { lintJsxCode } from 'laint';

const code = `
  <Link href="./profile">Profile</Link>
  <Button onPress={() => router.navigate('../settings')} />
`;

const results = lintJsxCode(code, {
  rules: ['no-relative-paths', 'no-stylesheet-create', 'expo-image-import']
});

// results:
// [
//   { rule: 'no-relative-paths', message: '...', line: 2, column: 14, severity: 'error' },
//   { rule: 'no-relative-paths', message: '...', line: 3, column: 41, severity: 'error' }
// ]
```

## Available Rules (26 total)

### Expo Router Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-relative-paths` | error | Use absolute paths in router.navigate/push and Link href |
| `header-shown-false` | warning | (tabs) Screen in root layout needs `headerShown: false` |

### React Native / Expo Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-stylesheet-create` | warning | Use inline styles instead of StyleSheet.create() |
| `no-safeareaview` | warning | Use useSafeAreaInsets() hook instead of SafeAreaView |
| `expo-image-import` | warning | Import Image from expo-image, not react-native |
| `no-tab-bar-height` | error | Never set explicit height in tabBarStyle |
| `scrollview-horizontal-flexgrow` | warning | Horizontal ScrollView needs `flexGrow: 0` |
| `expo-font-loaded-check` | error | useFonts() must check loaded before rendering |
| `tabs-screen-options-header-shown` | warning | Tabs screenOptions should have `headerShown: false` |
| `native-tabs-bottom-padding` | warning | NativeTabs screens need 64px bottom padding |
| `textinput-keyboard-avoiding` | warning | TextInput should be inside KeyboardAvoidingView |

### Liquid Glass Rules (expo-glass-effect)

| Rule | Severity | Description |
|------|----------|-------------|
| `no-border-width-on-glass` | error | No borderWidth on GlassView (breaks borderRadius) |
| `glass-needs-fallback` | warning | Check isLiquidGlassAvailable() before using GlassView |
| `glass-interactive-prop` | warning | GlassView in pressables needs `isInteractive={true}` |
| `glass-no-opacity-animation` | warning | No opacity animations on GlassView |

### React / JSX Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-class-components` | warning | Use function components with hooks |
| `no-inline-script-code` | error | Script tags should use template literals |
| `no-react-query-missing` | warning | Use @tanstack/react-query for data fetching |
| `browser-api-in-useeffect` | warning | window/localStorage only in useEffect for SSR |
| `fetch-response-ok-check` | warning | Check response.ok when using fetch |
| `no-complex-jsx-expressions` | warning | Avoid IIFEs and complex expressions in JSX |

### Tailwind CSS Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-tailwind-animation-classes` | warning | Avoid animate-* classes, use style jsx global instead |

### Backend / SQL Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `no-require-statements` | error | Use ES imports, not CommonJS require |
| `no-response-json-lowercase` | warning | Use Response.json() instead of new Response(JSON.stringify()) |
| `sql-no-nested-calls` | error | Don't nest sql template tags |

### General Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `prefer-lucide-icons` | warning | Prefer lucide-react/lucide-react-native icons |

---

## Rule Details

### `no-relative-paths`
```jsx
// Bad
router.navigate('./profile');
<Link href="../settings">

// Good
router.navigate('/(tabs)/profile');
<Link href="/settings">
```

### `browser-api-in-useeffect`
```jsx
// Bad - breaks SSR
function Component() {
  const width = window.innerWidth;
  return <div>{width}</div>;
}

// Good
function Component() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  return <div>{width}</div>;
}
```

### `fetch-response-ok-check`
```jsx
// Bad
const response = await fetch('/api/data');
const data = await response.json();

// Good
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const data = await response.json();
```

### `no-response-json-lowercase`
```jsx
// Bad
return new Response(JSON.stringify({ data }));

// Good
return Response.json({ data });
```

### `tabs-screen-options-header-shown`
```jsx
// Bad
<Tabs screenOptions={{ tabBarStyle: { ... } }}>

// Good
<Tabs screenOptions={{ headerShown: false, tabBarStyle: { ... } }}>
```

### `native-tabs-bottom-padding`
When using NativeTabs from expo-router/unstable-native-tabs, each screen needs 64px bottom padding to prevent content overlap with the tab bar.

### `textinput-keyboard-avoiding`
```jsx
// Bad - keyboard will cover input
<View>
  <TextInput placeholder="Enter text" />
</View>

// Good
<KeyboardAvoidingView>
  <TextInput placeholder="Enter text" />
</KeyboardAvoidingView>
```

### `glass-no-opacity-animation`
```jsx
// Bad - opacity animation causes visual glitches on GlassView
<GlassView style={{ opacity: fadeAnim }} />

// Good - use transform animations instead
<GlassView style={{ transform: [{ scale: scaleAnim }] }} />
```

### `no-complex-jsx-expressions`
```jsx
// Bad - IIFE in JSX
<div>{(() => { const x = compute(); return x; })()}</div>

// Good - extract to variable
const computedValue = compute();
<div>{computedValue}</div>
```

### `no-tailwind-animation-classes`
```jsx
// Bad - CSS animation classes have issues
<div className="animate-spin" />

// Good - use style jsx global for animations
<style jsx global>{`
  .spinner { animation: spin 1s linear infinite; }
`}</style>
<div className="spinner" />
```

### `sql-no-nested-calls`
```typescript
// Bad - nested sql causes issues
sql`UPDATE users SET ${sql`name = ${name}`} WHERE id = ${id}`

// Good - build query properly
sql`UPDATE users SET name = ${name} WHERE id = ${id}`
```

---

## Adding a New Rule

1. Create a rule file in `src/rules/`:

```typescript
// src/rules/my-rule.ts
import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { LintResult } from '../types';

export function myRule(ast: File, code: string): LintResult[] {
  const results: LintResult[] = [];

  traverse(ast, {
    CallExpression(path) {
      // Check for violations...
      results.push({
        rule: 'my-rule',
        message: 'Description of the issue',
        line: path.node.loc?.start.line ?? 0,
        column: path.node.loc?.start.column ?? 0,
        severity: 'error', // or 'warning'
      });
    },
  });

  return results;
}
```

2. Register in `src/rules/index.ts`
3. Add tests in `tests/my-rule.test.ts`
4. Run `npm test`

## API Reference

### `lintJsxCode(code: string, config: LintConfig): LintResult[]`

**Parameters:**
- `code` - JSX/TSX source code to lint
- `config.rules` - Array of rule names to enable

**Returns:** Array of `LintResult`:
```typescript
interface LintResult {
  rule: string;
  message: string;
  line: number;       // 1-indexed
  column: number;     // 0-indexed
  severity: 'error' | 'warning';
}
```

## Development

```bash
npm install     # Install dependencies
npm test        # Run tests (162 tests)
npm run build   # Build TypeScript
```
