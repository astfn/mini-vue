import pkg from "./package.json" assert { type: "json" };
import typescriptPlugin from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    /**
     * cjs版本
     */
    { format: "cjs", file: pkg.main },
    /**
     * esm版本
     */
    { format: "es", file: pkg.module },
  ],
  plugins: [typescriptPlugin()],
};
