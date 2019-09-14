import * as pptr from "puppeteer";
import Logger from "./logger";

function waitForLog(
  page: pptr.Page,
  matcher: (
    args: pptr.Serializable[],
    log: pptr.ConsoleMessage
  ) => Promise<boolean> | boolean
) {
  return new Promise<[pptr.Serializable[], pptr.ConsoleMessage]>(resolve => {
    async function handler(message: pptr.ConsoleMessage) {
      const args = await Promise.all(
        message.args().map(arg => arg.jsonValue())
      );
      if (await matcher(args, message)) {
        page.removeListener("console", handler);
        resolve([args, message]);
      }
    }
    page.addListener("console", handler);
  });
}

export default async function(
  page: pptr.Page,
  { file, logger }: { file: string; logger: Logger }
) {
  const [[, description]] = await waitForLog(
    page,
    async args => args.length === 2 && args[0] === "xomtest_start"
  );
  const newLength = logger.tests.push({
    assertations: [],
    description: description as string,
    done: false,
    file
  });
  const testNumber = newLength - 1;
  logger.rerender();
  {
    async function onLog(message: pptr.ConsoleMessage) {
      const args = await Promise.all(
        message.args().map(arg => arg.jsonValue())
      );
      if (args.length === 3 && args[0] === "xomtest_assert") {
        logger.tests[testNumber].assertations.push([args[1], args[2]]);
        logger.rerender();
      }
    }
    page.addListener("console", onLog);
    await waitForLog(
      page,
      async args => args.length === 1 && args[0] === "xomtest_done"
    );
    page.removeListener("console", onLog);
  }
  logger.tests[testNumber].done = true;
  logger.rerender();
}
