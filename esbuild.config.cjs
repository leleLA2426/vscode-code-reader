const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outdir: 'dist',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: !production,
  minify: production,
  tsconfig: 'tsconfig.json',
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
  entryPoints: {
    'webview/reader': 'webview/reader.ts',
    'webview/explainer': 'webview/explainer.ts',
  },
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !production,
  minify: production,
};

async function build() {
  try {
    const extCtx = await esbuild.build(extensionConfig);
    const webCtx = await esbuild.build(webviewConfig);

    if (watch) {
      await Promise.all([extCtx.watch(), webCtx.watch()]);
      console.log('[watch] build finished, watching for changes...');
    } else {
      console.log('[build] build finished');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

build();
