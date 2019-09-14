declare module "ansi-diff-stream" {
  import { Writable } from "stream";
  interface DiffStream extends Writable {
    reset(): void;
    clear(): void;
  }
  const createStream: () => DiffStream;
  export = createStream;
}
