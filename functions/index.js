export async function onRequest(context) {
  const value = await context.env.BLOG.get("first-key");

  if (value === null) {
    return new Response("Value not found", { status: 404 });
  }
  return new Response(value).headers({ "content-type": "text/html" });
}

