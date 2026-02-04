import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['sql-no-nested-calls'] };

describe('sql-no-nested-calls rule', () => {
  it('should detect nested sql template tag', () => {
    const code = "sql`UPDATE users SET ${sql`name = ${name}`} WHERE id = ${id}`";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('sql-no-nested-calls');
    expect(results[0].severity).toBe('error');
  });

  it('should detect nested sql function call', () => {
    const code = "sql`UPDATE invoices SET ${sql(setClause)} WHERE id = ${id}`";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('nest');
  });

  it('should allow simple sql template', () => {
    const code = "const rows = await sql`SELECT * FROM users WHERE id = ${userId}`";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow sql function form', () => {
    const code = "const rows = await sql('SELECT * FROM users WHERE id = $1', [userId])";
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow multiple separate sql calls', () => {
    const code = `
      const users = await sql\`SELECT * FROM users\`;
      const posts = await sql\`SELECT * FROM posts\`;
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect interpolating previous sql result', () => {
    const code = `
      let query = sql\`SELECT * FROM users WHERE 1=1\`;
      query = sql\`\${query} AND active = true\`;
    `;
    const results = lintJsxCode(code, config);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
