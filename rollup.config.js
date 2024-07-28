const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");

module.exports = [
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      banner: "#!/usr/bin/env node",
    },
    plugins: [resolve(), commonjs(), typescript()],
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.mjs",
      format: "es",
      banner: "#!/usr/bin/env node",
    },
    plugins: [resolve(), commonjs(), typescript()],
  },
  {
    input: "src/scripts/generate-tina-schema.ts",
    output: [
      {
        file: "dist/scripts/generate-tina-schema.cjs",
        format: "cjs",
        banner: "#!/usr/bin/env node",
      },
      {
        file: "dist/scripts/generate-tina-schema.mjs",
        format: "es",
        banner: "#!/usr/bin/env node",
      },
    ],
    plugins: [resolve(), commonjs(), typescript()],
  },
];
