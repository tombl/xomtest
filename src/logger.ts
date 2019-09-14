import createDiffStream from "ansi-diff-stream";
import chalk from "chalk";

interface Test {
  file: string;
  description: string;
  assertations: Array<[string, boolean]>;
  done: boolean;
}

export default class Logger {
  public tests: Test[] = [];
  private stream = createDiffStream();
  constructor() {
    this.rerender();
    this.stream.pipe(process.stdout);
  }
  public rerender() {
    this.stream.write(
      `${this.tests
        .filter(test => test.done)
        .sort((a, b) => {
          const apassed = a.assertations.every(([text, passed]) => passed);
          const bpassed = b.assertations.every(([text, passed]) => passed);
          if (apassed && !bpassed) {
            return -1;
          }
          if (bpassed && !apassed) {
            return 1;
          }
          return a.description > b.description ? 1 : -1;
        })
        .map(
          test =>
            `${
              test.assertations
                .sort(([a, apassed], [b, bpassed]) =>
                  apassed && !bpassed
                    ? -1
                    : bpassed && !apassed
                    ? 1
                    : a > b
                    ? 1
                    : -1
                )
                .every(([text, passed]) => passed)
                ? chalk.green(test.description)
                : `${chalk.red(test.description)}
                   ${test.assertations
                     .map(([text, passed]) =>
                       (passed ? chalk.green : chalk.red)(text)
                     )
                     .map(
                       (text, i, arr) =>
                         `${i === arr.length - 1 ? "└" : "├"} ${text}`
                     )
                     .join("\n")}`
            }`
        )
        .join("\n")}
        
        ${
          this.tests
            .filter(test => test.done)
            .filter(
              test =>
                test.done && test.assertations.every(([text, passed]) => passed)
            ).length
        }/${this.tests.length} tests passed ${
        this.tests.filter(test => test.done).length === this.tests.length
          ? ""
          : `
          ${this.tests.filter(test => test.done).length}/${
              this.tests.length
            } tests done`
      }`
        .split("\n")
        .map(line => line.trim())
        .join("\n")
    );
  }
}
