# laint

AI Agent Lint Rules SDK - a simple programmatic API for linting JSX/TSX code.

## Installation

```bash
npm install laint
```

## Usage

```typescript
import { lintJsxCode, getAllRuleNames } from 'laint';

const code = `
  <Link href="./profile">Profile</Link>
  <Button onPress={() => router.navigate('../settings')} />
`;

// Include mode (default): only run specified rules
const results = lintJsxCode(code, {
  rules: ['no-relative-paths', 'no-stylesheet-create', 'expo-image-import'],
});

// results:
// [
//   { rule: 'no-relative-paths', message: '...', line: 2, column: 14, severity: 'error' },
//   { rule: 'no-relative-paths', message: '...', line: 3, column: 41, severity: 'error' }
// ]
```

### Exclude Mode

Run all rules except specific ones:

```typescript
// Exclude mode: run ALL rules except those listed
const results = lintJsxCode(code, {
  rules: ['no-stylesheet-create'], // rules to skip
  exclude: true,
});

// Run all 31 rules
const allResults = lintJsxCode(code, {
  rules: [],
  exclude: true,
});

// Get list of all available rules
const ruleNames = getAllRuleNames(); // ['no-relative-paths', 'expo-image-import', ...]
```

## Available Rules (31 total)

### Expo Router Rules

| Rule                 | Severity | Description                                              |
| -------------------- | -------- | -------------------------------------------------------- |
| `no-relative-paths`  | error    | Use absolute paths in router.navigate/push and Link href |
| `header-shown-false` | warning  | (tabs) Screen in root layout needs `headerShown: false`  |

### React Native / Expo Rules

| Rule                               | Severity | Description                                          |
| ---------------------------------- | -------- | ---------------------------------------------------- |
| `no-stylesheet-create`             | warning  | Use inline styles instead of StyleSheet.create()     |
| `no-safeareaview`                  | warning  | Use useSafeAreaInsets() hook instead of SafeAreaView |
| `expo-image-import`                | warning  | Import Image from expo-image, not react-native       |
| `no-tab-bar-height`                | error    | Never set explicit height in tabBarStyle             |
| `scrollview-horizontal-flexgrow`   | warning  | Horizontal ScrollView needs `flexGrow: 0`            |
| `expo-font-loaded-check`           | error    | useFonts() must check loaded before rendering        |
| `tabs-screen-options-header-shown` | warning  | Tabs screenOptions should have `headerShown: false`  |
| `native-tabs-bottom-padding`       | warning  | NativeTabs screens need 64px bottom padding          |
| `textinput-keyboard-avoiding`      | warning  | TextInput should be inside KeyboardAvoidingView      |

### Liquid Glass Rules (expo-glass-effect)

| Rule                         | Severity | Description                                           |
| ---------------------------- | -------- | ----------------------------------------------------- |
| `no-border-width-on-glass`   | error    | No borderWidth on GlassView (breaks borderRadius)     |
| `glass-needs-fallback`       | warning  | Check isLiquidGlassAvailable() before using GlassView |
| `glass-interactive-prop`     | warning  | GlassView in pressables needs `isInteractive={true}`  |
| `glass-no-opacity-animation` | warning  | No opacity animations on GlassView                    |

### React / JSX Rules

| Rule                         | Severity | Description                                   |
| ---------------------------- | -------- | --------------------------------------------- |
| `no-class-components`        | warning  | Use function components with hooks            |
| `no-inline-script-code`      | error    | Script tags should use template literals      |
| `no-react-query-missing`     | warning  | Use @tanstack/react-query for data fetching   |
| `browser-api-in-useeffect`   | warning  | window/localStorage only in useEffect for SSR |
| `fetch-response-ok-check`    | warning  | Check response.ok when using fetch            |
| `no-complex-jsx-expressions` | warning  | Avoid IIFEs and complex expressions in JSX    |

### Screen Transitions Rules (react-native-screen-transitions)

| Rule                             | Severity | Description                                                               |
| -------------------------------- | -------- | ------------------------------------------------------------------------- |
| `transition-worklet-directive`   | error    | screenStyleInterpolator functions must include "worklet" directive        |
| `transition-progress-range`      | warning  | interpolate() should cover full [0, 1, 2] range including exit phase      |
| `transition-gesture-scrollview`  | warning  | Use Transition.ScrollView/FlatList instead of regular versions            |
| `transition-shared-tag-mismatch` | warning  | sharedBoundTag on Transition.Pressable must have matching Transition.View |
| `transition-prefer-blank-stack`  | warning  | Use Blank Stack instead of enableTransitions on Native Stack              |

### Tailwind CSS Rules

| Rule                            | Severity | Description                                            |
| ------------------------------- | -------- | ------------------------------------------------------ |
| `no-tailwind-animation-classes` | warning  | Avoid animate-\* classes, use style jsx global instead |

### Backend / SQL Rules

| Rule                         | Severity | Description                                                   |
| ---------------------------- | -------- | ------------------------------------------------------------- |
| `no-require-statements`      | error    | Use ES imports, not CommonJS require                          |
| `no-response-json-lowercase` | warning  | Use Response.json() instead of new Response(JSON.stringify()) |
| `sql-no-nested-calls`        | error    | Don't nest sql template tags                                  |

### General Rules

| Rule                  | Severity | Description                                   |
| --------------------- | -------- | --------------------------------------------- |
| `prefer-lucide-icons` | warning  | Prefer lucide-react/lucide-react-native icons |

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
<div>
  {(() => {
    const x = compute();
    return x;
  })()}
</div>;

// Good - extract to variable
const computedValue = compute();
<div>{computedValue}</div>;
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

### `transition-worklet-directive`

```jsx
// Bad - missing worklet directive
const options = {
  screenStyleInterpolator: (progress) => {
    return { opacity: progress };
  },
};

// Good
const options = {
  screenStyleInterpolator: (progress) => {
    'worklet';
    return { opacity: progress };
  },
};
```

### `transition-progress-range`

```jsx
// Bad - only covers [0, 1], missing exit phase
screenStyleInterpolator: (progress) => {
  'worklet';
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return { opacity };
};

// Good - covers full [0, 1, 2] range
screenStyleInterpolator: (progress) => {
  'worklet';
  const opacity = interpolate(progress, [0, 1, 2], [0, 1, 0]);
  return { opacity };
};
```

### `transition-gesture-scrollview`

```jsx
// Bad - regular ScrollView conflicts with transition gestures
import { Transition } from 'react-native-screen-transitions';
import { ScrollView } from 'react-native';
<ScrollView>...</ScrollView>;

// Good
import { Transition } from 'react-native-screen-transitions';
<Transition.ScrollView>...</Transition.ScrollView>;
```

### `transition-shared-tag-mismatch`

```jsx
// Bad - Pressable tag has no matching View
<Transition.Pressable sharedBoundTag="hero">
  <Image source={img} />
</Transition.Pressable>

// Good - matching tags on both components
<Transition.Pressable sharedBoundTag="hero">
  <Image source={img} />
</Transition.Pressable>
<Transition.View sharedBoundTag="hero">
  <Image source={img} />
</Transition.View>
```

### `transition-prefer-blank-stack`

```jsx
// Bad - enableTransitions on Native Stack has edge cases
<Stack.Screen options={{ enableTransitions: true }} />;

// Good - use Blank Stack from react-native-screen-transitions
import { BlankStack } from 'react-native-screen-transitions';
```

### `sql-no-nested-calls`

```typescript
// Bad - nested sql causes issues
sql`UPDATE users SET ${sql`name = ${name}`} WHERE id = ${id}`;

// Good - build query properly
sql`UPDATE users SET name = ${name} WHERE id = ${id}`;
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
- `config.rules` - Array of rule names
- `config.exclude` - (optional) When `true`, runs all rules except those in `rules`. Default: `false`

**Returns:** Array of `LintResult`:

```typescript
interface LintResult {
  rule: string;
  message: string;
  line: number; // 1-indexed
  column: number; // 0-indexed
  severity: 'error' | 'warning';
}
```

### `getAllRuleNames(): string[]`

Returns an array of all available rule names.

## Development

```bash
npm install     # Install dependencies
npm test        # Run tests (196 tests)
npm run build   # Build TypeScript
```
