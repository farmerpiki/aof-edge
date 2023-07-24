import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

function render_html(body, status = 200, extra_head = "") {
  var response = new Response(`
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<link rel="icon" href="/pkg/favicon.ico">
<link rel="stylesheet" href="/pkg/style.css">
<script src="/pkg/htmx.min.js"></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
` + extra_head + `
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
    {
      "headers": { "Content-Type": "text/html" },
      "status": status
    }
  );
  return response;

}

function render_404() {
  var response = render_html(`
<h1>Pagina nu a fost găsită (Eroare 404)</h1>
<h2>Ați ajuns la o pagină care nu există.</h2>
<p>E posibil ca aceasta să se fi întâmplat ca urmare a unui link expirat.</p>
<p>Dacă credeți că aceasta e o greșeală de partea noastră <a href="/contact">vă rugam să ne contactați</a> pentru a o putea rezolva.</p>
`, 404);
  return response;
}

async function render_markdown(env, key) {
  var value = await env.BLOG.get(key);

  if (value === null) {
    return render_404();
  }

  return render_html(marked.parse(value));
}

async function render_editor(env, key) {
  var value = await env.BLOG.get(key);

  if (value === null) {
    value = "";
  }

  return render_html(`<form class="editor" method="post"><textarea id="content" name="content">` + value + `</textarea><button type="submit">Salvează Pagina</button></form><main></main><div id="notification"></div>`, 200, `
<script src="/pkg/marked.min.js"></script>
<script src="/pkg/edit.js"></script>
  `);
}

async function render_blog_editor(env, key) {
  return render_html('blogeditor: ' + key);
}

async function render_blog_entry(env, key) {
  return render_html('blogpost: ' + key);
}

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET") {
      if (["/", "/about", "/schedule", "/contact", "/services"].includes(path)) {
        return render_markdown(environment, path);
      } else if (path.startsWith('/edit/')) {
        const sub_path = path.substring(5);
        if (sub_path.startsWith('/blog/')) {
          return render_blog_editor(environment, sub_path.substring(5));
        } else {
          return render_editor(environment, sub_path);
        }
      } else if (path.startsWith('/blog/')) {
        return render_blog_entry(environment, path.substring(5));
      } else if (path === '/blog') {
        return render_blog_page(environment);
      } else {
        return render_404();
      }
    } else if (request.method === "POST") {
      if (!path.startsWith('/edit/'))
        return new Response('{"error": "bad request"}', 400);
      var subpath = path.substring(5);
      if (subpath.startsWith('/blog/')) {

      } else {
        var json = await request.json()
        await environment.BLOG.put(subpath, json.content);
        return new Response('ok: ' + json.content);
      }
    }
    return render_404();
  },
};

