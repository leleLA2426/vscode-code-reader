const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

async function main() {
 const ctx = await esbuild.context({
    entryPoints: {
      extension: "src/extension.ts",
      "webview/reader": "webview/reader.ts",
    },
   bundle: true,
    outdir: "dist",
   external: ["vscode"],
    format: "cjs",
    platform: "node",
    sourcemap: !production,
    minify: production,
    tsconfig: "tsconfig.json",
  });

  if (watch) {
    await ctx.watch();
    console.log("watching...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
