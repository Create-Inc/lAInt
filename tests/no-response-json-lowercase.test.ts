import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-response-json-lowercase'] };

describe('no-response-json-lowercase rule', () => {
  it('should detect new Response(JSON.stringify())', () => {
    const code = `
      export async function GET() {
        return new Response(JSON.stringify({ data: 'test' }));
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-response-json-lowercase');
    expect(results[0].message).toContain('Response.json()');
    expect(results[0].severity).toBe('warning');
  });

  it('should allow Response.json()', () => {
    const code = `
      export async function GET() {
        return Response.json({ data: 'test' });
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow new Response with string', () => {
    const code = `
      export async function GET() {
        return new Response('Hello World');
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should allow new Response with status options', () => {
    const code = `
      export async function GET() {
        return new Response(null, { status: 204 });
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(0);
  });

  it('should detect in POST handlers', () => {
    const code = `
      export async function POST(request) {
        const body = await request.json();
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    `;
    const results = lintJsxCode(code, config);
    expect(results).toHaveLength(1);
  });
});
