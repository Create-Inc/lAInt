import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['browser-api-in-useeffect'] };

describe('browser-api-in-useeffect rule', () => {
  it('should detect window access outside useEffect', () => {
    const code = `
      function Component() {
        const width = window.innerWidth;
        return <div>{width}</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('browser-api-in-useeffect');
    expect(results[0].message).toContain('useEffect');
    expect(results[0].severity).toBe('warning');
  });

  it('should detect localStorage access outside useEffect', () => {
    const code = `
      function Component() {
        const token = localStorage.getItem('token');
        return <div>{token}</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('localStorage');
  });

  it('should allow window access inside useEffect', () => {
    const code = `
      function Component() {
        useEffect(() => {
          const width = window.innerWidth;
          console.log(width);
        }, []);
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow window access with typeof check', () => {
    const code = `
      function Component() {
        if (typeof window !== 'undefined') {
          const width = window.innerWidth;
        }
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow window access in event handlers', () => {
    const code = `
      function Component() {
        return <button onClick={() => window.alert('Hi')}>Click</button>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect document access outside useEffect', () => {
    const code = `
      function Component() {
        const el = document.getElementById('root');
        return <div>Hello</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });

  it('should allow code without browser APIs', () => {
    const code = `
      function Component() {
        const [count, setCount] = useState(0);
        return <div>{count}</div>;
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });
});
