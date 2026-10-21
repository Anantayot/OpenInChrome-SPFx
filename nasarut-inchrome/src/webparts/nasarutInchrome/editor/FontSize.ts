import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const SIZE: RegExp = /^\d{1,3}(?:\.\d+)?(?:px|pt)$/;

/** Adds a font-size attribute to the textStyle mark. */
export const FontSize: Extension = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element: HTMLElement) => {
            const value = element.style.fontSize;
            return value && SIZE.test(value) ? value : null;
          },
          renderHTML: (attributes: { fontSize?: string | null }) =>
            attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {}
        }
      }
    }];
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) =>
        SIZE.test(size) ? chain().setMark('textStyle', { fontSize: size }).run() : false,
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
    };
  }
});
