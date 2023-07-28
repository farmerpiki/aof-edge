import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

function render_html(body, options = {}) {
  if (!('status' in options))
    options['status'] = 200;

  if (!('headers' in options))
    options['headers'] = { "Content-Type": "text/html" }
  else
    options['headers']["Content-Type"] = "text/html";

  var response = new Response(`
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<link rel="icon" href="/pkg/favicon.ico">
<link rel="stylesheet" href="/pkg/style.css">
<script src="/pkg/htmx.min.js"></script>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Art of Feeling</title>
</head>
<body>
<header>
<nav>
<a href="/">Art of Feeling</a>
<button id="theme" hx-on:click="htmx.toggleClass(document.documentElement, 'dark')">󰖨/󰽥</button>
<span id="spacer"> </span>
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
<a href="https://www.facebook.com/Art-Of-Feeling-108957027466733"></a>
<a href="https://www.linkedin.com/in/adela-margin/"></a>
<a href="https://www.instagram.com/marginadela/">󰋾</a>
<a href="tel:+40740056316"></a>
<a href="mailto:adela.margin@gmail.com">󰴃</a>
<a href="https://wa.me/+40740056316">󰖣</a>
<a href="https://goo.gl/maps/PuEZqS9BTHyuz6Zd8"></a>
<a href="https://youtube.com/@adelamargin595"></a>
</footer>
</body>
</html>
`,
    options);
  return response;

}

function render_error(status, status_text, reason) {
  var response = render_html(`
<h1>` + status_text + ` (Eroare ` + status + `)</h1>
<p>` + reason + `</p>`, { "status": status });
  return response;
}

function render_400(reason) {
  render_error(400, 'Cerere incorectă', reason);
}

function render_401(reason) {
  render_error(401, 'Neautorizat', reason);
}

function render_404() {
  var response = render_html(`
<h1>Pagina nu a fost găsită (Eroare 404)</h1>
<h2>Ați ajuns la o pagină care nu există.</h2>
<p>E posibil ca aceasta să se fi întâmplat ca urmare a unui link expirat.</p>
<p>Dacă credeți că aceasta e o greșeală de partea noastră <a href="/contact">vă rugam să ne contactați</a> pentru a o putea rezolva.</p>
`, { "status": 404 });
  return response;
}

async function render_markdown(env, key) {
  var value = await env.AoF.get(key);

  if (value === null) {
    return render_404();
  }

  return render_html(marked.parse(value));
}

async function render_editor(env, key) {
  var value = await env.AoF.get(key);

  if (value === null) {
    value = "";
  }

  return render_html(`<form class="editor" method="post"><textarea id="content" name="content">` + value + `</textarea><button type="submit">Salvează Pagina</button></form><main></main><div id="notification"></div>`, 200, `
<script src="/pkg/marked.min.js"></script>
<script src="/pkg/edit.js"></script>
  `);
}

function admin_user_creation_form() {
  return `
<form method="post">
<label>Nume: <input type="text" name="user" placeholder="Nume"/></label>
<label>Parolă: <input type="password" name="pass" placeholder="Parolă"/></label>
<button type="submit">Crează cont administrator!</button>
</form>
`;
}
async function render_create_admin() {
  return render_html(admin_user_creation_form());
}

async function render_admin(env) {
  return render_html('<a href="/logout">Deconectare</a>',
    {
      headers: {
        "Cache-Control": "no-store",
      }
    },
  );
}

async function render_blog_editor(env, key) {
  return render_html('blogeditor: ' + key);
}

async function render_blog_entry(env, key) {
  return render_html('blogpost: ' + key);
}

async function verifyCredentials(env, user, pass) {
  const hashed_password = env.Aof.get('auth:' + user);
  return (hashed_password === await passwordHash(pass));
}

async function passwordHash(password) {
  const to_hash = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest({ name: 'SHA-256' }, to_hash);
  const hexString = [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hexString;
}

async function basicAuthentication(request) {
  const Authorization = request.headers.get("Authorization");

  const [scheme, encoded] = Authorization.split(" ");

  if (!encoded || scheme !== "Basic") {
    return {
      user: null,
      pass: null,
      reason: "Metodă de autorizare nesuportată.",
    }
  }

  const buffer = Uint8Array.from(atob(encoded), (character) =>
    character.charCodeAt(0)
  );
  const decoded = new TextDecoder().decode(buffer).normalize();

  const index = decoded.indexOf(":");

  if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
    return {
      user: null,
      pass: null,
      reason: "Valoarea primita pentru autorizare nu este validă.",
    }
  }

  return {
    user: decoded.substring(0, index),
    pass: decoded.substring(index + 1),
    reason: null
  };
}

export default {
  async fetch(request, environment, context) {
    var authenticated = false;
    if (request.headers.has("Authorization")) {
      const { user, pass, reason } = basicAuthentication(request);
      if (reason === null)
        authenticated = verifyCredentials(environment, user, pass);
      else
        render_400(reason);
    }
    const { protocol, pathname } = new URL(request.url);
    if (
      "https:" !== protocol ||
      "https" !== request.headers.get("x-forwarded-proto")
    ) {
      render_400("Vă rugăm folosiți o conexiune prin HTTPS!");
    }
    if (request.method === "GET") {
      if (["/", "/about", "/schedule", "/contact", "/services"].includes(pathname)) {
        return render_markdown(environment, pathname);
      } else if (pathname === '/admin') {
        if (authenticated) {
          return render_admin(env);
        }
        if (request.headers.has("Authorization")) {
          render_401('Credențiale incorecte.');
        }
        const users = await environment.AoF.list({ "prefix": "admin:", "limit": 1, });
        if (users["keys"].length === 0) {
          return render_create_admin();
        } else {
          return new Response('Login required', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="aof", charset="UTF-8"',
            },
          });
        }
      } else if (pathname.startsWith('/edit/')) {
        const sub_path = pathname.substring(5);
        if (sub_path.startsWith('/blog/')) {
          return render_blog_editor(environment, sub_path.substring(5));
        } else {
          return render_editor(environment, sub_path);
        }
      } else if (pathname.startsWith('/blog/')) {
        return render_blog_entry(environment, pathname.substring(5));
      } else if (pathname === '/blog') {
        return render_blog_page(environment);
      } else {
        return render_404();
      }
    } else if (request.method === "POST") {
      if (!pathname.startsWith('/edit/'))
        return new Response('{"error": "bad request"}', 400);
      var subpath = pathname.substring(5);
      if (subpath.startsWith('/blog/')) {

      } else {
        var json = await request.json()
        await environment.AoF.put(subpath, json.content);
        return new Response('ok: ' + json.content);
      }
    }
    return render_404();
  },
};

