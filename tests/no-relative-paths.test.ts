import { describe, it, expect } from 'vitest';
import { lintJsxCode } from '../src';

const config = { rules: ['no-relative-paths'] };

describe('no-relative-paths rule', () => {
  describe('router.navigate() calls', () => {
    it('should detect relative path with ./', () => {
      const code = `router.navigate('./profile');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].rule).toBe('no-relative-paths');
      expect(results[0].message).toContain('./profile');
      expect(results[0].severity).toBe('error');
    });

    it('should detect relative path with ../', () => {
      const code = `router.navigate('../settings');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('../settings');
    });

    it('should allow absolute paths', () => {
      const code = `router.navigate('/(tabs)/profile');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });

    it('should allow root absolute paths', () => {
      const code = `router.navigate('/about');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });
  });

  describe('router.push() calls', () => {
    it('should detect relative path', () => {
      const code = `router.push('./friends');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('./friends');
    });

    it('should allow absolute paths', () => {
      const code = `router.push('/settings');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });
  });

  describe('router.replace() calls', () => {
    it('should detect relative path', () => {
      const code = `router.replace('../home');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
    });
  });

  describe('getRouter().navigate() calls', () => {
    it('should detect relative path', () => {
      const code = `getRouter().navigate('./friends');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('./friends');
    });

    it('should allow absolute paths', () => {
      const code = `getRouter().navigate('/profile');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });
  });

  describe('<Link> component', () => {
    it('should detect relative path in href attribute', () => {
      const code = `<Link href="./profile">Profile</Link>`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('./profile');
      expect(results[0].message).toContain('<Link href>');
    });

    it('should detect relative path with ../', () => {
      const code = `<Link href="../settings">Settings</Link>`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
    });

    it('should allow absolute paths', () => {
      const code = `<Link href="/(tabs)/profile/friends">Friends</Link>`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });

    it('should allow root absolute paths', () => {
      const code = `<Link href="/about">About</Link>`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });

    it('should detect relative path in JSX expression', () => {
      const code = `<Link href={"./profile"}>Profile</Link>`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
    });
  });

  describe('Screen components (valid patterns)', () => {
    it('should not warn on Tabs.Screen with simple name', () => {
      const code = `<Tabs.Screen name="home" />`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });

    it('should not warn on Stack.Screen with simple name', () => {
      const code = `<Stack.Screen name="index" />`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });
  });

  describe('multiple violations', () => {
    it('should detect all violations in a file', () => {
      const code = `
        function App() {
          return (
            <View>
              <Link href="./profile">Profile</Link>
              <Link href="../settings">Settings</Link>
              <Button onPress={() => router.navigate('./home')} />
            </View>
          );
        }
      `;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(3);
    });
  });

  describe('line and column reporting', () => {
    it('should report correct line and column', () => {
      const code = `const x = 1;
router.navigate('./profile');`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
      expect(results[0].line).toBe(2);
      // Babel uses 0-indexed columns, so './profile' starts at column 16
      expect(results[0].column).toBe(16);
    });
  });

  describe('edge cases', () => {
    it('should not crash on empty code', () => {
      const results = lintJsxCode('', config);
      expect(results).toHaveLength(0);
    });

    it('should handle TypeScript code', () => {
      const code = `
        const navigate = (path: string) => router.navigate('./relative');
      `;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(1);
    });

    it('should not warn on variable paths', () => {
      const code = `router.navigate(somePath);`;
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });

    it('should not warn on template literal paths', () => {
      const code = 'router.navigate(`/${userId}`);';
      const results = lintJsxCode(code, config);
      expect(results).toHaveLength(0);
    });
  });
});
