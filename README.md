# laint

AI Agent Lint Rules SDK - a simple programmatic API for linting JSX/TSX code.

## Claude Code Integration

The fastest way to use laint is as a [Claude Code hook](https://docs.anthropic.com/en/docs/claude-code/hooks). After every file edit, Claude sees lint violations and fixes them automatically.

```bash
npx laint init
```

This writes a `.claude/settings.json` with a `PostToolUse` hook that runs after every `Edit` and `Write` tool call. If the file already exists, it merges without clobbering your other settings.

### Configuring Rules

By default, all 45 rules run. To customize, create a `laint.config.json` in your project root:

```json
// Only run these specific rules (include mode)
{
  "rules": ["no-relative-paths", "expo-image-import", "fetch-response-ok-check"]
}
```

```json
// Run all rules except these (exclude mode)
{
  "rules": ["no-tailwind-animation-classes", "no-stylesheet-create"],
  "exclude": true
}
```

```json
// Run all rules for a platform (platform mode)
{ "platform": "expo" }
```

**Platforms:** `expo`, `web`, `backend`. Platform mode runs all rules tagged for that platform plus universal rules (rules not specific to any platform).

### CLI

```bash
# Lint a file directly
npx laint check src/components/Button.tsx

# Hook mode (used by Claude Code automatically — reads stdin JSON)
npx laint check --hook
```

**Exit codes:**

- `0` — clean (no violations)
- `1` — violations found (file mode)
- `2` — violations found (hook mode, stderr output for Claude)

## Installation

```bash
npm install laint
```

## Programmatic Usage

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

// Run all 45 rules
const allResults = lintJsxCode(code, {
  rules: [],
  exclude: true,
});

// Get list of all available rules
const ruleNames = getAllRuleNames(); // ['no-relative-paths', 'expo-image-import', ...]
```

### Platform Mode

Run rules by platform — includes platform-tagged rules plus universal rules:

```typescript
import { lintJsxCode, getRulesForPlatform } from 'laint';

// Run all rules for Expo
const results = lintJsxCode(code, {
  rules: [],
  platform: 'expo',
});

// Get rule names for a platform
const expoRules = getRulesForPlatform('expo'); // expo-tagged + universal rules
const webRules = getRulesForPlatform('web');
const backendRules = getRulesForPlatform('backend');
```

## Available Rules (55 total)

### Expo Router Rules

| Rule                 | Severity | Platform  | Description                                              |
| -------------------- | -------- | --------- | -------------------------------------------------------- |
| `no-relative-paths`  | error    | expo, web | Use absolute paths in router.navigate/push and Link href |
| `header-shown-false` | warning  | expo      | (tabs) Screen in root layout needs `headerShown: false`  |

### React Native / Expo Rules

| Rule                               | Severity | Platform | Description                                          |
| ---------------------------------- | -------- | -------- | ---------------------------------------------------- |
| `no-stylesheet-create`             | warning  | expo     | Use inline styles instead of StyleSheet.create()     |
| `no-safeareaview`                  | warning  | expo     | Use useSafeAreaInsets() hook instead of SafeAreaView |
| `expo-image-import`                | warning  | expo     | Import Image from expo-image, not react-native       |
| `no-tab-bar-height`                | error    | expo     | Never set explicit height in tabBarStyle             |
| `scrollview-horizontal-flexgrow`   | warning  | expo     | Horizontal ScrollView needs `flexGrow: 0`            |
| `expo-font-loaded-check`           | error    | expo     | useFonts() must check loaded before rendering        |
| `tabs-screen-options-header-shown` | warning  | expo     | Tabs screenOptions should have `headerShown: false`  |
| `native-tabs-bottom-padding`       | warning  | expo     | NativeTabs screens need 64px bottom padding          |
| `textinput-keyboard-avoiding`      | warning  | expo     | TextInput should be inside KeyboardAvoidingView      |

### Liquid Glass Rules (expo-glass-effect)

| Rule                         | Severity | Platform | Description                                           |
| ---------------------------- | -------- | -------- | ----------------------------------------------------- |
| `no-border-width-on-glass`   | error    | expo     | No borderWidth on GlassView (breaks borderRadius)     |
| `glass-needs-fallback`       | warning  | expo     | Check isLiquidGlassAvailable() before using GlassView |
| `glass-interactive-prop`     | warning  | expo     | GlassView in pressables needs `isInteractive={true}`  |
| `glass-no-opacity-animation` | warning  | expo     | No opacity animations on GlassView                    |

### Next.js Rules

| Rule                         | Severity | Platform | Description                                                       |
| ---------------------------- | -------- | -------- | ----------------------------------------------------------------- |
| `require-use-client`         | error    | web      | Files using client-only features must have "use client" directive |
| `no-server-import-in-client` | error    | web      | "use client" files must not import server-only modules            |
| `ssr-browser-api-guard`      | error    | web      | Browser globals in server components crash during SSR             |

### React / JSX Rules

| Rule                         | Severity | Platform     | Description                                   |
| ---------------------------- | -------- | ------------ | --------------------------------------------- |
| `no-class-components`        | warning  | expo, web    | Use function components with hooks            |
| `no-inline-script-code`      | error    | web          | Script tags should use template literals      |
| `no-react-query-missing`     | warning  | expo, web    | Use @tanstack/react-query for data fetching   |
| `browser-api-in-useeffect`   | warning  | web          | window/localStorage only in useEffect for SSR |
| `fetch-response-ok-check`    | warning  | web, backend | Check response.ok when using fetch            |
| `no-complex-jsx-expressions` | warning  | expo, web    | Avoid IIFEs and complex expressions in JSX    |

### Screen Transitions Rules (react-native-screen-transitions)

| Rule                             | Severity | Platform | Description                                                               |
| -------------------------------- | -------- | -------- | ------------------------------------------------------------------------- |
| `transition-worklet-directive`   | error    | expo     | screenStyleInterpolator functions must include "worklet" directive        |
| `transition-progress-range`      | warning  | expo     | interpolate() should cover full [0, 1, 2] range including exit phase      |
| `transition-gesture-scrollview`  | warning  | expo     | Use Transition.ScrollView/FlatList instead of regular versions            |
| `transition-shared-tag-mismatch` | warning  | expo     | sharedBoundTag on Transition.Pressable must have matching Transition.View |
| `transition-prefer-blank-stack`  | warning  | expo     | Use Blank Stack instead of enableTransitions on Native Stack              |

### Tailwind CSS Rules

| Rule                            | Severity | Platform | Description                                            |
| ------------------------------- | -------- | -------- | ------------------------------------------------------ |
| `no-tailwind-animation-classes` | warning  | web      | Avoid animate-\* classes, use style jsx global instead |
| `no-inline-styles`              | warning  | web      | Avoid inline styles, use Tailwind CSS classes instead  |

### Backend / SQL Rules

| Rule                         | Severity | Platform | Description                                                   |
| ---------------------------- | -------- | -------- | ------------------------------------------------------------- |
| `no-require-statements`      | error    | backend  | Use ES imports, not CommonJS require                          |
| `no-response-json-lowercase` | warning  | backend  | Use Response.json() instead of new Response(JSON.stringify()) |
| `sql-no-nested-calls`        | error    | backend  | Don't nest sql template tags                                  |
| `no-sync-fs`                 | error    | backend  | Use fs.promises or fs/promises instead of sync fs methods     |

### URL Rules

| Rule                     | Severity | Description                                                    |
| ------------------------ | -------- | -------------------------------------------------------------- |
| `url-params-must-encode` | warning  | URL query param values must be wrapped in encodeURIComponent() |

### Error Handling Rules

| Rule                       | Severity | Description                                                        |
| -------------------------- | -------- | ------------------------------------------------------------------ |
| `catch-must-log-to-sentry` | warning  | Catch blocks with logger.error/console.error must also call Sentry |

### Code Style Rules

| Rule                     | Severity | Platform  | Description                                                      |
| ------------------------ | -------- | --------- | ---------------------------------------------------------------- |
| `prefer-guard-clauses`   | warning  | universal | Use early returns instead of nesting if statements               |
| `no-type-assertion`      | warning  | universal | Avoid `as` type casts; use type narrowing or proper types        |
| `safe-json-parse`        | warning  | universal | Wrap JSON.parse in try-catch to handle malformed input           |
| `no-loose-equality`      | warning  | universal | Use === and !== instead of == and != (except == null)            |
| `no-magic-env-strings`   | warning  | universal | Use centralized enum for env variable names, not magic strings   |
| `no-nested-try-catch`    | warning  | universal | Avoid nested try-catch blocks, extract to separate functions     |
| `no-string-coerce-error` | warning  | universal | Use JSON.stringify instead of String() for unknown caught errors |
| `logger-error-with-err`  | warning  | universal | logger.error() must include { err: Error } for stack traces      |
| `no-optional-props`      | warning  | universal | Use `prop: T \| null` instead of `prop?: T` in interfaces        |
| `no-silent-skip`         | warning  | universal | Add else branch with logging instead of silently skipping        |
| `no-manual-retry-loop`   | warning  | universal | Use a retry library instead of manual retry/polling loops        |
| `no-emoji-icons`         | warning  | universal | Use icons from lucide-react instead of emoji characters          |
| `prefer-named-params`    | warning  | universal | Use object destructuring instead of positional parameters        |

### General Rules

| Rule                                 | Severity | Platform  | Description                                                      |
| ------------------------------------ | -------- | --------- | ---------------------------------------------------------------- |
| `prefer-lucide-icons`                | warning  | expo, web | Prefer lucide-react/lucide-react-native icons                    |
| `no-react-native-in-web`             | error    | web       | Don't import react-native in web modules (causes ESM failures)   |
| `no-module-level-new`                | error    | web       | Don't use `new` at module scope (crashes during SSR)             |
| `no-require-statements`              | error    | backend   | Use ES imports, not CommonJS require                             |
| `no-response-json-lowercase`         | warning  | backend   | Use Response.json() instead of new Response(JSON.stringify())    |
| `sql-no-nested-calls`                | error    | backend   | Don't nest sql template tags                                     |
| `no-sync-fs`                         | error    | backend   | Use fs.promises or fs/promises instead of sync fs methods        |
| `no-unrestricted-loop-in-serverless` | error    | backend   | Unbounded loops (while(true), for(;;)) cause serverless timeouts |
| `prefer-promise-all`                 | warning  | universal | Use Promise.all instead of sequential await in for...of loops    |
| `prefer-lucide-icons`                | warning  | expo, web | Prefer lucide-react/lucide-react-native icons                    |
| `no-react-native-in-web`             | error    | web       | Don't import react-native in web modules (causes ESM failures)   |
| `prefer-lucide-icons`                | warning  | expo, web | Prefer lucide-react/lucide-react-native icons                    |
| `no-module-level-new`                | error    | web       | Don't use `new` at module scope (crashes during SSR)             |
| `no-deprecated-url-parse`            | warning  | backend   | Use `new URL()` instead of deprecated `url.parse()`              |

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

### `require-use-client`

```tsx
// Bad - uses hooks without "use client"
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Good - has "use client" directive
('use client');

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### `no-server-import-in-client`

```tsx
// Bad - server-only module in client file
'use client';

import { cookies } from 'next/headers';

export function UserMenu() {
  return <div>Menu</div>;
}

// Good - use server-only modules only in server components
import { cookies } from 'next/headers';

export function UserMenu() {
  const session = cookies().get('session');
  return <div>Menu</div>;
}
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

### `prefer-guard-clauses`

```typescript
// Bad - entire function body wrapped in if
function handleClick(user) {
  if (user) {
    doSomething();
    doMore();
  }
}

// Good - early return
function handleClick(user) {
  if (!user) return;
  doSomething();
  doMore();
}
```

### `no-type-assertion`

```typescript
// Bad - type casting
const value = data as string;
const user = response.data as User;

// Good - type narrowing
if (typeof data === 'string') {
  const value = data;
}

// Good - proper typing
const user: User = response.data;
```

### `no-loose-equality`

```typescript
// Bad - loose equality
if (a == b) {
}
if (x != 'hello') {
}

// Good - strict equality
if (a === b) {
}
if (x !== 'hello') {
}

// OK - == null is idiomatic for null/undefined check
if (value == null) {
}
```

### `no-magic-env-strings`

````typescript
// Bad - hardcoded env string
const key = process.env.API_KEY;
const url = process.env['DATABASE_URL'];

// Good - use centralized enum
const key = process.env[EnvVars.API_KEY];

### `url-params-must-encode`

```typescript
// Bad - unencoded query param
const url = `https://api.example.com?q=${query}`;

// Good - encoded query param
const url = `https://api.example.com?q=${encodeURIComponent(query)}`;
````

### `catch-must-log-to-sentry`

```typescript
// Bad - logs error but no Sentry
try {
  fetchData();
} catch (error) {
  logger.error('Failed', error);
}

// Good - both logging and Sentry
try {
  fetchData();
} catch (error) {
  logger.error('Failed', error);
  Sentry.captureException(error);
}
```

### `no-nested-try-catch`

```typescript
// Bad - nested try-catch
try {
  try {
    inner();
  } catch (e) {}
} catch (e) {}

// Good - extract to separate function
function safeInner() {
  try {
    inner();
  } catch (e) {}
}
try {
  safeInner();
} catch (e) {}
```

### `no-inline-styles`

```tsx
// Bad - inline style objects
<div style={{ color: 'red', fontSize: 16 }}>Hello</div>

// Good - Tailwind CSS classes
<div className="text-red-500 text-base">Hello</div>
```

### `no-string-coerce-error`

```typescript
// Bad - String() on a non-Error object produces '[object Object]'
const message = error instanceof Error ? error.message : String(error);

// Good - JSON.stringify preserves object structure
const message = error instanceof Error ? error.message : JSON.stringify(error);
```

### `logger-error-with-err`

```typescript
// Bad - missing err property
logger.error({}, 'something failed');
logger.error({ userId: 1 }, 'request failed');
logger.error('something went wrong');

// Good - includes err for stack traces
logger.error({ err: error }, 'something failed');
logger.error({ err: new Error('x'), userId: 1 }, 'request failed');
```

### `no-silent-skip`

```typescript
// Bad - silently skips when user is falsy
function process(user) {
  if (user) {
    sendEmail(user);
    updateDb(user);
  }
}

// Good - logs why the else case was skipped
function process(user) {
  if (user) {
    sendEmail(user);
    updateDb(user);
  } else {
    logger.warn('No user provided, skipping processing');
  }
}

// Also fine - guard clause with early return
function process(user) {
  if (!user) return;
  sendEmail(user);
  updateDb(user);
}
```

### `no-manual-retry-loop`

```typescript
// Bad - manual retry loop with setTimeout
for (let attempt = 0; attempt < 15; attempt++) {
  const result = await checkStatus(id);
  if (result.ready) return result;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

// Good - use a retry library
import retry from 'async-retry';
const result = await retry(
  async () => {
    const res = await checkStatus(id);
    if (!res.ready) throw new Error('not ready');
    return res;
  },
  { retries: 15, minTimeout: 2000 },
);
```

---

### `no-emoji-icons`

```typescript
// Bad - emoji characters as icons
<Text>✅ Done</Text>
<Button label="🔥 Hot" />

// Good - use icon library
import { Check, Flame } from 'lucide-react';
<Text><Check /> Done</Text>
<Button label={<><Flame /> Hot</>} />
```

---

### `safe-json-parse`

```typescript
// Bad - JSON.parse without error handling
const data = JSON.parse(rawInput);

// Good - wrapped in try-catch
try {
  const data = JSON.parse(rawInput);
} catch (e) {
  console.error('Failed to parse JSON', e);
}

// For JSON.stringify with circular references, consider using fast-safe-stringify
// import stringify from "fast-safe-stringify";
// const str = stringify(circularObj);
```

---

### `no-optional-props`

```typescript
// Bad - optional properties create implicit undefined
interface UserProps {
  name?: string;
  age?: number;
}

// Good - explicit null union
interface UserProps {
  name: string | null;
  age: number | null;
}
```

### `no-sync-fs`

```typescript
// Bad - synchronous fs methods block the event loop
import fs from 'fs';
const data = fs.readFileSync('file.txt', 'utf-8');
fs.writeFileSync('output.txt', data);

// Good - use async fs methods
import { readFile, writeFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf-8');
await writeFile('output.txt', data);
```

### `prefer-named-params`

```typescript
// Bad - positional parameters
function createUser(name: string, email: string, age: number) {
  return { name, email, age };
}

// Good - named parameters via object destructuring
function createUser({ name, email, age }: { name: string; email: string; age: number }) {
  return { name, email, age };
}
```

Callbacks (`.map`, `.filter`, `.reduce`, `.sort`, `.then`, etc.) and `React.forwardRef`/`memo` are excluded.

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
- `config.platform` - (optional) `'expo' | 'web' | 'backend'`. When set, runs platform-tagged + universal rules. Takes precedence over `rules`/`exclude`

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

### `getRulesForPlatform(platform: Platform): string[]`

Returns rule names for a platform (platform-tagged + universal rules).

**Platforms:** `'expo' | 'web' | 'backend'`

## Development

```bash
npm install     # Install dependencies
npm test        # Run tests
npm run build   # Build TypeScript
npm run lint    # ESLint + Prettier
npm run knip    # Dead code detection
```
