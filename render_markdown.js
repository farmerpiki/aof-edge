import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

export async function render_markdown(context, key) {
  var value = await context.env.BLOG.get(key);

  if (value === null) {
    value = "<h1>Adică știi când țiuie?</h1>";//return new Response("Page not found", { status: 404 });
  }
  var response = new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="/favicon.png">
<link rel="stylesheet" href="/style.css">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Art of Feeling</title>
</head>
<body>
<main>
` + marked.parse(value) + `
</main>
</body>
</html>
`,
    { headers: { "Content-Type": "text/html" } }
  );
  return response;
}

