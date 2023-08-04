import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

function render_html(body, options = {}, extra_head = "") {
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
<link rel="stylesheet" href="/pkg/style.css" as="style">
<link rel="preload" href="/pkg/InconsolataNerdFontMono-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/pkg/Quicksand.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/pkg/DancingScript.woff2" as="font" type="font/woff2" crossorigin>
<script src="/pkg/default.js"></script>
<script src="/pkg/htmx.min.js"></script>
${extra_head}
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Art of Feeling</title>
</head>
<body>
<header>
<nav>
<a href="/">Art of Feeling</a>
<button id="theme" hx-on:click="setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')">󰖨/󰽥</button>
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
${body}
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
<h1>${status_text} (Eroare ${status})</h1>
<p>${reason}</p>`, { "status": status });
  return response;
}

function render_400(reason) {
  return render_error(400, 'Cerere incorectă', reason);
}

function render_401(reason) {
  return render_error(401, 'Neautorizat', reason);
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

async function render_markdown(env, prefix, key) {
  var value = await env.AoF.get(prefix + key);

  if (value === null) {
    return render_404();
  }

  return render_html(marked.parse(value));
}

async function render_editor(env, prefix, key) {
  var value = await env.AoF.get(prefix + key);

  if (value === null) {
    value = "";
  }

  return render_html(`<form class="editor" method="post"><textarea id="content" name="content">` + value + `</textarea><button type="submit">Salvează Pagina</button></form><main></main><div id="notification"></div>`, { "status": 200 }, `
<script src="/pkg/marked.min.js"></script>
<script src="/pkg/edit.js"></script>
  `);
}

function escapeHtml(unsafeText) {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function render_blog_page(env) {
  var pages = await env.AoF.list({ "prefix": 'blog:' });

  if (pages === null)
    return render_html("<h1>Blog</h1><p>Conținutul nu este disponibil momentan.");

  var result = "";
  pages.keys.forEach((element) => {
    if (element.hasOwnProperty("name")
      && element.hasOwnProperty("metadata")
      && element.metadata.hasOwnProperty("title")
      && element.metadata.hasOwnProperty("preview")
    )
      result += `
<h2>${escapeHtml(element.metadata.title)}</h2>
<p>${escapeHtml(element.metadata.preview)}<a href=/blog/${encodeURIComponent(element.name.substring(5))}>... citește continuarea</a></p>`;
  });

  return render_html(`<h1>Blog</h1>
${result}`);
}

function admin_user_creation_form() {
  return `
<form method="post">
<fieldset>
<legend>Crează un utilizator nou</legend>
<label for="user">Nume:</label><input type="text" id="user" name="user" placeholder="Nume"/>
<label for="pass">Parolă:</label><input type="password" id="pass" name="pass" placeholder="Parolă"/>
<button type="submit">Crează cont administrator!</button>
</fieldset>
</form>
`;
}
async function render_create_admin() {
  return render_html(admin_user_creation_form(),
    {
      headers: {
        "Cache-Control": "no-store",
      }
    },
  );
}

async function render_admin(env) {
  return render_html(admin_user_creation_form() + '<a href="/logout">Deconectare</a>',
    {
      headers: {
        "Cache-Control": "no-store",
      }
    },
  );
}

async function verifyCredentials(env, user, pass) {
  const hashed_password = await env.Aof.get('admin:' + user);
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
    };
  }

  return {
    user: decoded.substring(0, index),
    pass: decoded.substring(index + 1),
    reason: null
  };
}

function truncateText(input, length_overflow = 150) {
  const isWhitespace = (char) => /\p{White_Space}/u.test(char);

  if (input.length <= length_overflow) {
    return input;
  }

  let cutPosition = -1;
  for (let i = length_overflow; i < input.length; i++) {
    if (isWhitespace(input[i])) {
      cutPosition = i;
      break;
    }
  }

  return input.substring(0, cutPosition);
}

export default {
  async fetch(request, environment, _context) {
    var authenticated = false;
    if (request.headers.has("Authorization")) {
      const { user, pass, reason } = await basicAuthentication(request);
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
      if (pathname.startsWith('/blog/')) {
        if (authenticated)
          return render_editor(environment, 'blog:', pathname.substring(6));
        else
          return render_markdown(environment, 'blog:', pathname.substring(6));
      } else if (pathname === '/blog') {
        return render_blog_page(environment);
      } else if (pathname === '/admin') {
        if (authenticated) {
          return render_admin(environment);
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
      } else if (pathname === '/logout') {
        return render_401("You are logged out.");
      } else {
        if (authenticated)
          return render_editor(environment, 'page:', pathname);
        else
          return render_markdown(environment, 'page:', pathname);
      }
    } else if (request.method === "POST") {
      if (pathname === '/blog')
        return new Response('{"error": "bad request"}', { "status": 400 });
      if (pathname === '/logout')
        return new Response('You are logged out.', { "status": 401 });
      if (pathname === '/admin') {
        const body = await request.formData();
        const { user, pass } = Object.fromEntries(body);
        if (!user || !pass)
          return render_400('Cerere invalidă respinsă.');
        if (/[\0-\x1F\x7F]/.test(user) || /[\0-\x1F\x7F]/.test(pass))
          return render_400('Cerere invalidă! Caractere nepermise prezente.');
        if (authenticated) {
          const hashed_password = await passwordHash(pass);
          await environment.Aof.put('admin:' + user, hashed_password);
          return new Response('{success: true}');
        } else {
          const users = await environment.AoF.list({ "prefix": "admin:", "limit": 1, });
          if (users["keys"].length === 0) {
            const hashed_password = await passwordHash(pass);
            await environment.AoF.put('admin:' + user, hashed_password);
            return new Response('{success: true}');
          } else {
            return render_401('Autentificare necesară!');
          }
        }
      }
      if (pathname.startsWith('/blog/')) {
        var json = await request.json();
        var title = null;
        var preview = null;
        const walkTokens = (token) => {
          if (token.type === 'heading') {
            if (token.depth == 1) {
              if (title === null) {
                title = token.text;
              } else {
                token.depth += 1;
              }
            }
          } else if (token.type === 'paragraph') {
            if (preview === null)
              preview = truncateText(token.text);
          }
        }
        marked.use({ walkTokens });
        marked.parse(json.content);
        await environment.AoF.put('blog:' + pathname.substring(6), json.content, {
          "metadata": {
            "title": title,
            "preview": preview,
          }
        });
        return new Response('{success: true}');
      } else {
        var json = await request.json();
        await environment.AoF.put('page:' + pathname, json.content);
        return new Response('{success: true}');
      }
    }
    return render_404();
  },
};

