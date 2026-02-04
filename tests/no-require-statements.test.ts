import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-require-statements'] };

describe('no-require-statements rule', () => {
  it('should detect require() calls', () => {
    const code = `const fs = require('fs');`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-require-statements');
    expect(results[0].message).toContain('import statements');
  });

  it('should detect multiple require() calls', () => {
    const code = `
      const fs = require('fs');
      const path = require('path');
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(2);
  });

  it('should allow import statements', () => {
    const code = `import fs from 'fs';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow named imports', () => {
    const code = `import { readFile } from 'fs';`;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect require in nested code', () => {
    const code = `
      function loadModule() {
        return require('some-module');
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
