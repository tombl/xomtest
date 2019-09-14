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
        .sort((a, b) => (a.description > b.description ? 1 : -1))
        .map(
          test =>
            `${
              test.assertations.every(([text, passed]) => passed)
                ? chalk.green(test.description)
                : `${chalk.red(test.description)}
                  | ${test.assertations
                    .map(([text, passed]) =>
                      (passed ? chalk.green : chalk.red)(text)
                    )
                    .join("\n| ")}`
            }`
        )
        .join("\n")}
        
        ${
          this.tests
            .filter(test => test.done)
            .filter(
              test =>
                test.done &&
                test.assertations.filter(([text, passed]) => passed)
            ).length
        } tests passed`
        .split("\n")
        .map(line => line.trim())
        .join("\n")
    );
  }
}
