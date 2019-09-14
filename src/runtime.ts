export default async function test(
  name: string,
  run: () =>
    | Generator<[string, boolean], void, void>
    | AsyncGenerator<[string, boolean], void, void>
): Promise<void> {
  console.log("xomtest_start", name);
  await new Promise(r => setTimeout(r, 25));
  for await (const entry of run()) {
    console.log("xomtest_assert", ...entry);
  }
  console.log("xomtest_done");
}
