import { marked } from "marked";

marked.use({
  mangle: false,
  headerIds: false
});

export async function render_markdown(context, key) {
  const value = await context.env.BLOG.get(key);

  if (value === null) {
    return new Response("Value not found", { status: 404 });
  }
  var response = new Response(
    marked.parse(value),
    { headers: { "Content-Type": "text/html" } }
  );
  return response;
}

