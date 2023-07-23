import { render_html } from "../render_markdown.js"

export async function onRequest(context) {
  var value = await context.env.BLOG.list({ "prefix": "blog:" });

  if (value === null) {
    return new Response("Page not found", { status: 404 });
  }

  return render_html(JSON.stringify(value));
}

