import { render_markdown } from "../render_markdown.js"

export async function onRequest(context) {
  return render_markdown(context, "pages:index");
}

