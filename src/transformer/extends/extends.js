/**
 * @typedef {import('../core/ParserBase').ParserBase} ParserBase
 */

/**
 * A registry for all available extensions.
 * @type {Object.<string, { block?: (new () => ParserBase)[], inline?: (new () => ParserBase)[] }>}
 */
export const extensionRegistry = {
  // ESM version of this file will be compiled into `dist/transformer.extends.mjs`
  // and can be used in browser directly.
  //
  // But we cannot use dynamic import in ESM to load extensions,
  // so we have to manually register all extensions here.
  //
  // Example:
  //
  // 'my-extension': {
  //   block: [MyBlockParser],
  //   inline: [MyInlineParser],
  // }
};

/**
 * Creates an array of extension parsers.
 *
 * @param {Object} options
 * @param {string[]} options.names An array of extension names.
 * @returns {{ inlineParsers: (new () => ParserBase)[], blockParsers: (new () => ParserBase)[] }}
 */
export function createExtensionParsers({ names }) {
  const inlineParsers = [];
  const blockParsers = [];

  for (const name of names) {
    const extension = extensionRegistry[name];
    if (extension) {
      if (extension.block) {
        blockParsers.push(...extension.block);
      }
      if (extension.inline) {
        inlineParsers.push(...extension.inline);
      }
    }
  }

  return { inlineParsers, blockParsers };
}

/**
 * Gets a list of available extension names.
 *
 * @returns {string[]}
 */
export function getAvailableExtensions() {
  return Object.keys(extensionRegistry);
}
