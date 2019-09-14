export default function({
  file,
  library
}: {
  file: string;
  library: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Test ${file}</title>
  <script type="importmap-shim">
    {
      "imports": {
        "xomtest/runtime": "/runtime.js",
        "${library}": "/library.js"
      }
    }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module-shim" src="/tests/${file}"></script>
  <script src="/es-module-shims.js"></script>
</body>
</html>`;
}
