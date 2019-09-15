import { rollup } from "rollup";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";

let code: string;

export default async function({
  packageJsonPath
}: {
  packageJsonPath: string;
}) {
  if (code === undefined) {
    const packageJson = require(packageJsonPath);
    if (packageJson.module === undefined && packageJson.main === undefined) {
      return "";
    }
    const bundle = await rollup({
      external: ["xomtest/runtime"],
      input: packageJson.module || packageJson.main,
      plugins: [commonjs(), nodeResolve()]
    });
    const { output } = await bundle.generate({
      format: "esm"
    });
    code = output[0].code;
  }
  return code;
}
