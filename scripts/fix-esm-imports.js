import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';

const DIST_DIR = 'dist';

async function fixImportsInFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  const fileDir = dirname(filePath);
  let modified = false;

  // Fix @babel/traverse CJS/ESM interop
  // Replace: import traverse from '@babel/traverse';
  // With: import _traverse from '@babel/traverse'; const traverse = _traverse.default || _traverse;
  if (content.includes("import traverse from '@babel/traverse'")) {
    content = content.replace(
      "import traverse from '@babel/traverse';",
      "import _traverse from '@babel/traverse';\nconst traverse = _traverse.default || _traverse;",
    );
    modified = true;
  }

  // Add .js extension to relative imports that don't have one
  // Matches: from './foo' or from '../foo' (but not from './foo.js')
  const fixed = await replaceAsync(
    content,
    /from ['"](\.[^'"]+)['"]/g,
    async (match, importPath) => {
      // Don't modify if already ends with .js
      if (importPath.endsWith('.js')) return match;

      // Check if it's a directory import (needs /index.js)
      const resolvedPath = join(fileDir, importPath);
      try {
        const stats = await stat(resolvedPath);
        if (stats.isDirectory()) {
          return `from '${importPath}/index.js'`;
        }
      } catch {
        // Not a directory, just add .js
      }

      return `from '${importPath}.js'`;
    },
  );

  const originalContent = await readFile(filePath, 'utf-8');
  if (originalContent !== fixed) {
    await writeFile(filePath, fixed);
    console.log(`Fixed: ${filePath}`);
  }
}

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    promises.push(asyncFn(match, ...args));
    return match;
  });
  const results = await Promise.all(promises);
  return str.replace(regex, () => results.shift());
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.js')) {
      await fixImportsInFile(fullPath);
    }
  }
}

await processDirectory(DIST_DIR);
console.log('ESM imports fixed!');
