import { InlineContext, MarkdownConfig } from "@lezer/markdown";
import { cherryTags } from "./tags";

const HighlightDelim = {
  resolve: "CherryHighlight",
  mark: "CherryHighlightMark",
};
const SpoilerDelim = { resolve: "CherrySpoiler", mark: "CherrySpoilerMark" };
const CommentDelim = {
  resolve: "CherryInlineComment",
  mark: "CherryCommentMark",
};
const MathDelim = { resolve: "CherryMathInline", mark: "CherryMathMark" };

export const FrontmatterParser = {
  name: "Frontmatter",
  parse(cx: any, line: any) {
    if (cx.lineStart === 0 && line.text.startsWith("---")) {
      const start = cx.lineStart;
      const firstMarkEnd = start + 3;
      cx.nextLine();

      while (cx.lineStart < cx.to) {
        if (cx.line.text.startsWith("---")) {
          const end = cx.lineStart + cx.line.text.length;
          const children = [
            cx.elt("CherryFrontmatterMark", start, firstMarkEnd),
          ];
          if (firstMarkEnd < cx.lineStart) {
            children.push(cx.elt("Frontmatter", firstMarkEnd, cx.lineStart));
          }
          children.push(cx.elt("CherryFrontmatterMark", cx.lineStart, end));

          cx.addElement(cx.elt("Frontmatter", start, end, children));
          cx.nextLine();
          return true;
        }
        cx.nextLine();
      }
    }
    return false;
  },
  before: "HorizontalRule",
};

export const CherryInlinesExtension: MarkdownConfig = {
  defineNodes: [
    { name: "CherryHighlight", style: cherryTags.highlight },
    { name: "CherryHighlightMark", style: cherryTags.highlight },
    { name: "CherrySpoiler", style: cherryTags.spoiler },
    { name: "CherrySpoilerMark", style: cherryTags.spoiler },
    { name: "CherryMathInline", style: cherryTags.mathInline },
    { name: "CherryMathMark", style: cherryTags.mathInline },
    { name: "CherryInlineComment", style: cherryTags.inlineComment },
    { name: "CherryCommentMark", style: cherryTags.inlineComment },
    { name: "CherryHtmlAttrs", style: cherryTags.htmlAttrs },
    { name: "CherryAlert", style: cherryTags.alert },
    { name: "CherryFieldTag", style: cherryTags.fieldTag },
    { name: "CherryPageLink", style: cherryTags.pageLink },
    { name: "CherryAtType", style: cherryTags.atType },
    { name: "CherryMedia", style: cherryTags.media },
    { name: "CherryIframe", style: cherryTags.iframe },
    { name: "CherryContainerMark", style: cherryTags.containerMark },
    { name: "CherryContainerType", style: cherryTags.containerType },
    { name: "CherryInlineContainer" },
    { name: "CherryContainerKey", style: cherryTags.containerKey },
    { name: "CherryContainerValue", style: cherryTags.containerValue },
    { name: "CherryContainerParam", style: cherryTags.containerParam },
    { name: "Frontmatter", style: cherryTags.frontmatter },
    { name: "CherryFrontmatterMark", style: cherryTags.frontmatterMark },
  ],
  parseBlock: [FrontmatterParser],
  parseInline: [
    {
      name: "CherryInlines",
      parse(cx: InlineContext, next: number, pos: number) {
        // ==highlight==
        if (next === 61 /* '=' */ && cx.char(pos + 1) === 61) {
          return cx.addDelimiter(HighlightDelim, pos, pos + 2, true, true);
        }

        // [[page link]]
        if (next === 91 /* '[' */ && cx.char(pos + 1) === 91) {
          let end = -1;
          for (let i = pos + 2; i < cx.end - 1; i++) {
            if (cx.char(i) === 93 /* ']' */ && cx.char(i + 1) === 93) {
              end = i + 2;
              break;
            }
          }
          if (end !== -1)
            return cx.addElement(cx.elt("CherryPageLink", pos, end));
        }

        // !!spoiler!!
        if (next === 33 /* '!' */ && cx.char(pos + 1) === 33) {
          return cx.addDelimiter(SpoilerDelim, pos, pos + 2, true, true);
        }

        // %%comment%%
        if (next === 37 /* '%' */ && cx.char(pos + 1) === 37) {
          return cx.addDelimiter(CommentDelim, pos, pos + 2, true, true);
        }

        // $math$ or $$math$$ (inline)
        if (next === 36 /* '$' */) {
          if (cx.char(pos + 1) === 36) {
            // $$ delimiter
            return cx.addDelimiter(MathDelim, pos, pos + 2, true, true);
          } else {
            // $ delimiter
            return cx.addDelimiter(MathDelim, pos, pos + 1, true, true);
          }
        }

        // [!NOTE] GitHub Alerts
        if (next === 91 /* '[' */ && cx.char(pos + 1) === 33 /* '!' */) {
          const match = /^\[![A-Za-z]+\]/.exec(cx.slice(pos, pos + 20));
          if (match) {
            return cx.addElement(
              cx.elt("CherryAlert", pos, pos + match[0].length),
            );
          }
        }

        // !video[, !audio[, !iframe[, !frame[
        if (next === 33 /* '!' */) {
          const slice = cx.slice(pos, Math.min(cx.end, pos + 10));
          if (slice.startsWith("!video[")) {
            return cx.addElement(cx.elt("CherryMedia", pos, pos + 6));
          } else if (slice.startsWith("!audio[")) {
            return cx.addElement(cx.elt("CherryMedia", pos, pos + 6));
          } else if (slice.startsWith("!iframe[")) {
            return cx.addElement(cx.elt("CherryIframe", pos, pos + 7));
          } else if (slice.startsWith("!frame[")) {
            return cx.addElement(cx.elt("CherryIframe", pos, pos + 6));
          }
        }

        // @type syntax
        if (next === 64 /* '@' */) {
          const match = /^@([a-zA-Z0-9_-]+)/.exec(cx.slice(pos, cx.end));
          // Only match if it's the start of the line or preceded by a space/newline
          if (
            match &&
            (pos === 0 || cx.char(pos - 1) === 10 || cx.char(pos - 1) === 32)
          ) {
            return cx.addElement(
              cx.elt("CherryAtType", pos, pos + match[0].length),
            );
          }
        }

        // Container Marks (::: tip, :::: collapse, etc)
        if (next === 58 /* ':' */) {
          const match = /^(:{3,})([^\n]*)/.exec(cx.slice(pos, cx.end));
          // 只匹配独立成行的，或者前面是空格的
          if (match) {
            const markerLen = match[1].length;
            const typeStr = match[2];
            const children = [
              cx.elt("CherryContainerMark", pos, pos + markerLen),
            ];

            if (typeStr && typeStr.trim().length > 0) {
              let currentPos = pos + markerLen;
              const str = match[2];

              // First token is the type (e.g. card, tip, repo-card)
              const typeMatch = /^\s*([a-zA-Z0-9_-]+)/.exec(str);
              if (typeMatch) {
                const typeStart =
                  currentPos + typeMatch[0].indexOf(typeMatch[1]);
                const typeEnd = typeStart + typeMatch[1].length;
                children.push(
                  cx.elt("CherryContainerType", typeStart, typeEnd),
                );

                let rest = str.slice(typeMatch[0].length);
                let restPos = typeEnd;

                // Now parse the rest for keys, values, and params
                const tokenRegex = /([a-zA-Z0-9_-]+)="([^"]*)"|([^\s]+)/g;
                let tokenMatch;
                while ((tokenMatch = tokenRegex.exec(rest)) !== null) {
                  const tokenStart = restPos + tokenMatch.index;
                  if (tokenMatch[1]) {
                    // Key="Value"
                    const keyStart = tokenStart;
                    const keyEnd = keyStart + tokenMatch[1].length;
                    children.push(
                      cx.elt("CherryContainerKey", keyStart, keyEnd),
                    );

                    const valStart = keyEnd + 2; // skip ="
                    const valEnd = valStart + tokenMatch[2].length;
                    children.push(
                      cx.elt("CherryContainerValue", valStart, valEnd),
                    );
                  } else if (tokenMatch[3]) {
                    // Param
                    const paramStart = tokenStart;
                    const paramEnd = paramStart + tokenMatch[3].length;
                    children.push(
                      cx.elt("CherryContainerParam", paramStart, paramEnd),
                    );
                  }
                }
              } else {
                children.push(
                  cx.elt(
                    "CherryContainerType",
                    pos + markerLen,
                    pos + match[0].length,
                  ),
                );
              }
            }

            return cx.addElement(
              cx.elt(
                "CherryInlineContainer",
                pos,
                pos + match[0].length,
                children,
              ),
            );
          }
        }

        // {html attrs} (e.g. {.important})
        if (next === 123 /* '{' */ && cx.char(pos + 1) !== 123) {
          let end = -1;
          for (let i = pos + 1; i < cx.end; i++) {
            if (cx.char(i) === 125 /* '}' */) {
              end = i + 1;
              break;
            }
          }
          if (end !== -1)
            return cx.addElement(cx.elt("CherryHtmlAttrs", pos, end));
        }

        return -1;
      },
      before: "Emphasis",
    },
  ],
};
