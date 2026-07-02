import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-empty-screen-component'] };

describe('no-empty-screen-component rule', () => {
  it('flags the classic orphan stub: export default function Index() { return null; }', () => {
    const code = `
      export default function Index() {
        return null;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-empty-screen-component');
    expect(results[0].severity).toBe('error');
    expect(results[0].message).toContain('renders nothing');
  });

  it('flags an implicit empty return (`return;`)', () => {
    const code = `
      export default function Screen() {
        return;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  it('flags return undefined', () => {
    const code = `
      export default function Home() {
        return undefined;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  it('flags an empty fragment return', () => {
    const code = `
      export default function Home() {
        return <></>;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  it('flags a concise arrow default export returning null', () => {
    const code = `const Index = () => null;\nexport default Index;`;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  it('flags anonymous default export returning null', () => {
    const code = `export default function () { return null; }`;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  it('flags identifier default export resolving to a null-returning function', () => {
    const code = `
      function Home() {
        return null;
      }
      export default Home;
    `;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });

  // --- should NOT flag ---

  it('does not flag a component that returns real JSX', () => {
    const code = `
      export default function Index() {
        return <View><Text>Gift Cards</Text></View>;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a component with a conditional early return null (loading/auth gate)', () => {
    const code = `
      export default function Screen() {
        if (!ready) return null;
        return <View><Text>Ready</Text></View>;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a component that does work before rendering', () => {
    const code = `
      export default function Screen() {
        const insets = useSafeAreaInsets();
        return <View style={{ paddingTop: insets.top }} />;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a non-default helper that returns null', () => {
    const code = `
      export function maybeRender() {
        return null;
      }
      export default function Screen() {
        return <View />;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a camelCase default export (not a component)', () => {
    const code = `
      const config = () => null;
      export default config;
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a fragment that contains real children', () => {
    const code = `
      export default function Home() {
        return <><Text>Hi</Text></>;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(0);
  });

  it('does not flag a fragment default export with an empty fragment but only whitespace', () => {
    // whitespace-only fragment IS flagged (renders nothing); real children are not.
    const code = `
      export default function Home() {
        return <>   </>;
      }
    `;
    expect(lintJsxCode(code, config)).toHaveLength(1);
  });
});
