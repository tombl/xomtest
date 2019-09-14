#!/usr/bin/env node
import findUp from "find-up";
import { promises as fs } from "fs";
import getPort from "get-port";
import Koa from "koa";
import mount from "koa-mount";
import Queue from "p-queue";
import { join } from "path";
import pptr from "puppeteer";
import ts from "typescript";
import bundleLib from "./bundle-lib";
import handlePage from "./handle-page";
import Logger from "./logger";
import template from "./template";

const app = new Koa();
const queue = new Queue({ concurrency: 8 });

pptr.launch({ headless: false }).then(async browser => {
  const port = await getPort();
  const server = app.listen(port);
  const packageJsonPath = await findUp("package.json");
  if (packageJsonPath === undefined) {
    console.error("package.json not found");
    process.exit(1);
  }

  app.use(
    mount("/tests", async (ctx: Koa.Context) => {
      if (ctx.URL.pathname.split(".").slice(-1)[0] !== "ts") {
        return;
      }
      ctx.type = ".js";
      ctx.body = ts.transpileModule(
        await fs.readFile(
          join(packageJsonPath!, "..", ctx.URL.pathname),
          "utf8"
        ),
        {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2017
          },
          fileName: ctx.URL.pathname
        }
      ).outputText;
    })
  );

  app.use(
    mount("/test", async (ctx: Koa.Context) => {
      ctx.type = ".html";
      ctx.body = template({
        file: ctx.URL.searchParams.get("file")!,
        library: require(packageJsonPath!).name || "library"
      });
    })
  );

  app.use(
    mount("/runtime.js", async (ctx: Koa.Context) => {
      ctx.type = ".js";
      ctx.body = await fs.readFile(join(__dirname, "runtime.js"), "utf8");
    })
  );

  app.use(
    mount("/library.js", async (ctx: Koa.Context) => {
      ctx.type = ".js";
      ctx.body = await bundleLib({ packageJsonPath: packageJsonPath! });
    })
  );

  app.use(
    mount("/es-module-shims.js", async (ctx: Koa.Context) => {
      ctx.type = ".js";
      ctx.body = await fs.readFile(require.resolve("es-module-shims"), "utf8");
    })
  );

  const testDir = join(packageJsonPath!, "../tests");
  const logger = new Logger();
  await Promise.all(
    (await fs.readdir(testDir))
      .filter(
        file =>
          file[0] !== "_" &&
          (file.slice(-3) === ".ts" || file.slice(-4) === ".tsx")
      )
      .map(file =>
        queue.add(async () => {
          const page = await browser.newPage();
          await page.goto(
            `http://localhost:${port}/test?file=${encodeURIComponent(file)}`
          );
          await handlePage(page, { file, logger });
          await page.close();
        })
      )
  );
  await browser.close();
  server.close();
  process.exit(
    logger.tests.every(test =>
      test.assertations.every(([text, passed]) => passed)
    )
      ? 0
      : 1
  );
});
