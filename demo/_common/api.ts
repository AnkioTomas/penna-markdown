export interface DocFile {
  name: string;
  isDir: boolean;
  href: string;
}

export async function fetchDocsList(): Promise<DocFile[]> {
  try {
    const res = await fetch("/docs/?json");
    if (!res.ok) throw new Error("Failed to fetch docs list");
    const list = await res.json() as DocFile[];
    return list.filter(f => f.name.endsWith(".md") && !f.isDir);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function fetchDocContent(href: string): Promise<string> {
  try {
    const res = await fetch(href);
    if (!res.ok) throw new Error("Failed to fetch doc content");
    return await res.text();
  } catch (e) {
    console.error(e);
    return "加载失败...";
  }
}
