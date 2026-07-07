export async function copyText(text: string, doc: Document): Promise<void> {
  const nav = doc.defaultView?.navigator;
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return;
  }

  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  doc.body.appendChild(textarea);
  textarea.select();
  doc.execCommand("copy");
  doc.body.removeChild(textarea);
}
