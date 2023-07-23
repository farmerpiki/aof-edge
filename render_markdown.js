import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

export function render_html(body) {
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
<div>
<header>
<nav>
<a href="/">Art of Feeling</a>
<input type="checkbox" id="showmenu"><label for="showmenu">≡</label>
<a href="/about">Cine suntem</a>
<a href="/services">Servicii</a>
<a href="/blog">Blog</a>
<a href="/schedule">Programări</a>
<a href="/contact">Contact</a>
</nav>
</header>
<main>
` + body + `
</main>
<footer>
© 2023 Art of Feeling
</footer>
</div>
</body>
</html>
`,
    { headers: { "Content-Type": "text/html" } }
  );
  return response;

}

export async function render_markdown(context, key) {
  var value = await context.env.BLOG.get(key);

  if (value === null) {
    return new Response("Page not found", { status: 404 });
  }
  return render_html(marked.parse(value));
}

