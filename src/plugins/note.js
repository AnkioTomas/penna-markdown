export default function notePlugin(md) {
  function noteBlock(state, startLine, endLine, silent) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(start, max);
    if (!line.startsWith("::note::")) return false;

    let nextLine = startLine + 1;
    while (nextLine < endLine) {
      const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const nextMax = state.eMarks[nextLine];
      const nextLineText = state.src.slice(nextStart, nextMax);
      if (nextLineText.trim() === "::endnote::") break;
      nextLine++;
    }

    if (silent) return true;

    const tokenOpen = state.push("note_open", "div", 1);
    tokenOpen.attrs = [["class", "note"]];
    state.md.block.tokenize(state, startLine + 1, nextLine);
    const tokenClose = state.push("note_close", "div", -1);
    state.line = nextLine + 1;
    return true;
  }

  md.block.ruler.before('fence', 'note_block', noteBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list']
  });
}