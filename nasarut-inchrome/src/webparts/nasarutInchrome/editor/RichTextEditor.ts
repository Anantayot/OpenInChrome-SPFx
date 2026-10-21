import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';

import { FontSize } from './FontSize';
import { buildHref, isAllowedHref, isChromeHref, stripChrome } from './links';
import { sanitizeHtml } from './sanitize';
import { ensureStyles } from './styles';

export interface IRichTextEditorOptions {
  html: string;
  placeholder?: string;
  onChange: (html: string) => void;
}

const ICONS: { [name: string]: string } = {
  alignLeft: '<path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8"/>',
  alignCenter: '<path d="M2 3h12M4 6.5h8M2 10h12M4 13.5h8"/>',
  alignRight: '<path d="M2 3h12M6 6.5h8M2 10h12M6 13.5h8"/>',
  justify: '<path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12"/>',
  bullet: '<path d="M6 4h8M6 8h8M6 12h8"/><path d="M2.6 4h.01M2.6 8h.01M2.6 12h.01" stroke-width="2.4"/>',
  numbered: '<path d="M7 4h7M7 8h7M7 12h7M2.5 2.8l1-.6v3.6M2 9.3c.2-.7 1.9-.8 1.9.3 0 .7-1.9 1.4-1.9 2.1h2"/>',
  outdent: '<path d="M7 4h7M7 8h7M7 12h7M4.5 6 2.5 8l2 2"/>',
  indent: '<path d="M7 4h7M7 8h7M7 12h7M2.5 6l2 2-2 2"/>',
  link: '<path d="M6.5 9.5l3-3M5.3 7.7 4 9a2.1 2.1 0 0 0 3 3l1.3-1.3M10.7 8.3 12 7a2.1 2.1 0 0 0-3-3L7.7 5.3"/>',
  unlink: '<path d="M5.3 7.7 4 9a2.1 2.1 0 0 0 3 3l1.3-1.3M10.7 8.3 12 7a2.1 2.1 0 0 0-3-3L7.7 5.3M2.5 2.5l11 11"/>',
  table: '<rect x="2" y="3" width="12" height="10" rx="1"/><path d="M2 6.5h12M2 10h12M6.5 3v10"/>',
  clear: '<path d="M4 3.5h7M7.5 3.5v6M3 13.5l10-10"/>',
  undo: '<path d="M5 3.5 2.5 6 5 8.5M2.5 6H10a3.5 3.5 0 0 1 0 7H7"/>',
  redo: '<path d="M11 3.5 13.5 6 11 8.5M13.5 6H6a3.5 3.5 0 0 0 0 7h3"/>',
  hr: '<path d="M2 8h12"/>'
};

const TEXT_COLORS: string[] = ['#a4262c', '#e81123', '#ca5010', '#c19c00', '#8cbd18', '#107c10',
  '#00b7c3', '#0078d4', '#002050', '#5c2d91', '#605e5c', '#000000'];
const HIGHLIGHTS: string[] = ['#fff100', '#00ff00', '#00ffff', '#ff00ff', '#9fd5ff', '#ffb3b3',
  '#ffd8a8', '#d7f5c4', '#e6d8ff', '#c0c0c0', '#808080', '#ffffaa'];
const SIZES: number[] = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 42, 48];

interface IButton {
  el: HTMLButtonElement;
  isActive?: () => boolean;
  isEnabled?: () => boolean;
}

function svg(name: string): string {
  return `<svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[name]}</svg>`;
}

/** Highlight that also understands pasted <span style="background-color:..."> (SharePoint Text output). */
const SpanHighlight = Highlight.extend({
  parseHTML() {
    return [
      { tag: 'mark' },
      {
        tag: 'span',
        // Not consuming, so the same span still gives its colour / size to textStyle.
        consuming: false,
        priority: 60,
        getAttrs: (node: HTMLElement | string) =>
          typeof node !== 'string' && node.style.backgroundColor &&
          !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(node.style.backgroundColor) ? {} : false
      }
    ];
  }
});

export class RichTextEditor {
  public readonly editor: Editor;

  private readonly root: HTMLDivElement;
  private readonly toolbar: HTMLDivElement;
  private readonly buttons: IButton[] = [];
  private readonly options: IRichTextEditorOptions;
  private styleSelect!: HTMLSelectElement;
  private sizeSelect!: HTMLSelectElement;
  private colorBar!: HTMLSpanElement;
  private highlightBar!: HTMLSpanElement;
  private popover: HTMLDivElement | undefined;
  private linkRange: { from: number; to: number } | undefined;
  private changeTimer: number | undefined;
  private readonly onDocMouseDown = (e: MouseEvent): void => {
    if (this.popover && !this.popover.contains(e.target as Node) &&
        !(e.target as Element).closest?.('[data-oict-pop-anchor]')) {
      this.closePopover();
    }
  };

  constructor(host: HTMLElement, options: IRichTextEditorOptions) {
    ensureStyles(host.ownerDocument);
    this.options = options;

    this.root = host.ownerDocument.createElement('div');
    this.root.className = 'oict';
    this.toolbar = host.ownerDocument.createElement('div');
    this.toolbar.className = 'oict-toolbar';
    this.toolbar.setAttribute('role', 'toolbar');
    this.toolbar.setAttribute('aria-label', 'จัดรูปแบบข้อความ');
    const body = host.ownerDocument.createElement('div');
    body.className = 'oict-editor oict-content';
    this.root.appendChild(this.toolbar);
    this.root.appendChild(body);
    host.replaceChildren(this.root);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const Shortcuts = Extension.create({
      name: 'oictShortcuts',
      addKeyboardShortcuts() {
        return { 'Mod-k': () => { self.openLinkPanel(); return true; } };
      }
    });

    this.editor = new Editor({
      element: body,
      content: sanitizeHtml(options.html),
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
        Underline,
        TextStyle,
        Color,
        FontSize,
        SpanHighlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Subscript,
        Superscript,
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { target: null, rel: null, class: null },
          isAllowedUri: (url: string) => isAllowedHref(url)
        }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: options.placeholder || 'เขียนข้อความที่นี่…' }),
        Shortcuts
      ],
      onUpdate: () => this.scheduleChange(),
      onTransaction: () => this.refreshToolbar()
    });

    this.buildToolbar();
    this.refreshToolbar();
    host.ownerDocument.addEventListener('mousedown', this.onDocMouseDown, true);
  }

  public getHtml(): string {
    return sanitizeHtml(this.editor.getHTML());
  }

  public destroy(): void {
    if (this.changeTimer !== undefined) {
      window.clearTimeout(this.changeTimer);
      this.options.onChange(this.getHtml());
    }
    this.root.ownerDocument.removeEventListener('mousedown', this.onDocMouseDown, true);
    this.editor.destroy();
    this.root.remove();
  }

  // ---------- toolbar ----------

  private buildToolbar(): void {
    const e = this.editor;

    this.styleSelect = this.select('รูปแบบ', [
      ['p', 'ข้อความปกติ'], ['h1', 'หัวเรื่อง 1'], ['h2', 'หัวเรื่อง 2'], ['h3', 'หัวเรื่อง 3'],
      ['h4', 'หัวเรื่อง 4'], ['quote', 'คำพูด'], ['code', 'ตัวอักษรความกว้างคงที่']
    ], (v: string) => {
      const c = e.chain().focus();
      if (v === 'p') { c.setParagraph().run(); }
      else if (v === 'quote') { c.setParagraph().toggleBlockquote().run(); }
      else if (v === 'code') { c.toggleCodeBlock().run(); }
      else { c.setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 }).run(); }
    });
    this.styleSelect.style.width = '132px';

    this.sizeSelect = this.select('ขนาดตัวอักษร',
      [['', 'ขนาด']].concat(SIZES.map(s => [`${s}px`, String(s)])),
      (v: string) => {
        if (v) { e.chain().focus().setFontSize(v).run(); } else { e.chain().focus().unsetFontSize().run(); }
      });
    this.sizeSelect.style.width = '64px';
    this.sep();

    this.btn('<b>B</b>', 'ตัวหนา (Ctrl+B)', () => e.chain().focus().toggleBold().run(), () => e.isActive('bold'));
    this.btn('<i style="font-family:serif">I</i>', 'ตัวเอียง (Ctrl+I)', () => e.chain().focus().toggleItalic().run(), () => e.isActive('italic'));
    this.btn('<u>U</u>', 'ขีดเส้นใต้ (Ctrl+U)', () => e.chain().focus().toggleUnderline().run(), () => e.isActive('underline'));
    this.btn('<s>S</s>', 'ขีดทับ', () => e.chain().focus().toggleStrike().run(), () => e.isActive('strike'));
    this.btn('x<sub style="font-size:9px">2</sub>', 'ตัวห้อย', () => e.chain().focus().unsetSuperscript().toggleSubscript().run(), () => e.isActive('subscript'));
    this.btn('x<sup style="font-size:9px">2</sup>', 'ตัวยก', () => e.chain().focus().unsetSubscript().toggleSuperscript().run(), () => e.isActive('superscript'));
    this.sep();

    const color = this.btn('<span style="margin-top:-4px">A</span><span class="oict-bar"></span>', 'สีตัวอักษร', (b: HTMLButtonElement) =>
      this.openSwatches(b, TEXT_COLORS, 'อัตโนมัติ',
        (c: string) => e.chain().focus().setColor(c).run(),
        () => e.chain().focus().unsetColor().run()));
    this.colorBar = color.querySelector('.oict-bar') as HTMLSpanElement;

    const hl = this.btn('<span style="margin-top:-4px;font-weight:400">ab</span><span class="oict-bar"></span>', 'ไฮไลต์', (b: HTMLButtonElement) =>
      this.openSwatches(b, HIGHLIGHTS, 'ไม่มีไฮไลต์',
        (c: string) => e.chain().focus().setHighlight({ color: c }).run(),
        () => e.chain().focus().unsetHighlight().run()));
    this.highlightBar = hl.querySelector('.oict-bar') as HTMLSpanElement;
    this.sep();

    this.btn(svg('alignLeft'), 'ชิดซ้าย', () => e.chain().focus().setTextAlign('left').run(),
      () => e.isActive({ textAlign: 'left' }) || !['center', 'right', 'justify'].some(a => e.isActive({ textAlign: a })));
    this.btn(svg('alignCenter'), 'กึ่งกลาง', () => e.chain().focus().setTextAlign('center').run(), () => e.isActive({ textAlign: 'center' }));
    this.btn(svg('alignRight'), 'ชิดขวา', () => e.chain().focus().setTextAlign('right').run(), () => e.isActive({ textAlign: 'right' }));
    this.btn(svg('justify'), 'เต็มแนว', () => e.chain().focus().setTextAlign('justify').run(), () => e.isActive({ textAlign: 'justify' }));
    this.sep();

    this.btn(svg('bullet'), 'รายการสัญลักษณ์แสดงหัวข้อย่อย', () => e.chain().focus().toggleBulletList().run(), () => e.isActive('bulletList'));
    this.btn(svg('numbered'), 'รายการลำดับเลข', () => e.chain().focus().toggleOrderedList().run(), () => e.isActive('orderedList'));
    this.btn(svg('outdent'), 'ลดการเยื้อง', () => e.chain().focus().liftListItem('listItem').run(), undefined, () => e.can().liftListItem('listItem'));
    this.btn(svg('indent'), 'เพิ่มการเยื้อง', () => e.chain().focus().sinkListItem('listItem').run(), undefined, () => e.can().sinkListItem('listItem'));
    this.sep();

    this.btn(svg('link'), 'ลิงก์ (Ctrl+K)', () => this.openLinkPanel(), () => e.isActive('link'));
    this.btn(svg('unlink'), 'เอาลิงก์ออก', () => e.chain().focus().extendMarkRange('link').unsetLink().run(), undefined, () => e.isActive('link'));
    this.btn(svg('table'), 'ตาราง', (b: HTMLButtonElement) => this.openTableMenu(b), () => e.isActive('table'));
    this.btn(svg('hr'), 'เส้นคั่น', () => e.chain().focus().setHorizontalRule().run());
    this.sep();

    this.btn(svg('clear'), 'ล้างการจัดรูปแบบ', () => e.chain().focus().unsetAllMarks().clearNodes().run());
    this.btn(svg('undo'), 'เลิกทำ (Ctrl+Z)', () => e.chain().focus().undo().run(), undefined, () => e.can().undo());
    this.btn(svg('redo'), 'ทำซ้ำ (Ctrl+Y)', () => e.chain().focus().redo().run(), undefined, () => e.can().redo());
  }

  private btn(html: string, title: string, run: (b: HTMLButtonElement) => void,
    isActive?: () => boolean, isEnabled?: () => boolean): HTMLButtonElement {
    const b = this.root.ownerDocument.createElement('button');
    b.type = 'button';
    b.className = 'oict-btn';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.innerHTML = html;
    // Keep the editor selection when a toolbar button is pressed.
    b.addEventListener('mousedown', (ev: MouseEvent) => ev.preventDefault());
    b.addEventListener('click', () => run(b));
    this.toolbar.appendChild(b);
    this.buttons.push({ el: b, isActive, isEnabled });
    return b;
  }

  private select(title: string, items: string[][], onPick: (v: string) => void): HTMLSelectElement {
    const s = this.root.ownerDocument.createElement('select');
    s.className = 'oict-select';
    s.title = title;
    s.setAttribute('aria-label', title);
    for (const [value, label] of items) {
      const o = this.root.ownerDocument.createElement('option');
      o.value = value;
      o.textContent = label;
      s.appendChild(o);
    }
    s.addEventListener('change', () => onPick(s.value));
    this.toolbar.appendChild(s);
    return s;
  }

  private sep(): void {
    const d = this.root.ownerDocument.createElement('span');
    d.className = 'oict-sep';
    this.toolbar.appendChild(d);
  }

  private refreshToolbar(): void {
    if (!this.styleSelect) {
      return;
    }
    const e = this.editor;
    for (const b of this.buttons) {
      b.el.classList.toggle('is-active', !!b.isActive && b.isActive());
      b.el.setAttribute('aria-pressed', String(!!b.isActive && b.isActive()));
      b.el.disabled = !!b.isEnabled && !b.isEnabled();
    }

    let style = 'p';
    for (const level of [1, 2, 3, 4]) {
      if (e.isActive('heading', { level })) { style = `h${level}`; }
    }
    if (e.isActive('blockquote')) { style = 'quote'; }
    if (e.isActive('codeBlock')) { style = 'code'; }
    this.styleSelect.value = style;

    const size = (e.getAttributes('textStyle').fontSize as string) || '';
    this.sizeSelect.value = SIZES.some(s => `${s}px` === size) ? size : '';

    this.colorBar.style.background = (e.getAttributes('textStyle').color as string) || '#323130';
    this.highlightBar.style.background = (e.getAttributes('highlight').color as string) || 'transparent';
  }

  private scheduleChange(): void {
    if (this.changeTimer !== undefined) {
      window.clearTimeout(this.changeTimer);
    }
    this.changeTimer = window.setTimeout(() => {
      this.changeTimer = undefined;
      this.options.onChange(this.getHtml());
    }, 300);
  }

  // ---------- popovers ----------

  private openPopover(anchor: HTMLElement, content: HTMLElement, extraClass: string = ''): void {
    this.closePopover();
    const pop = this.root.ownerDocument.createElement('div');
    pop.className = `oict-pop ${extraClass}`;
    pop.appendChild(content);
    pop.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.preventDefault(); this.closePopover(); this.editor.commands.focus(); }
    });
    this.root.appendChild(pop);

    const rootBox = this.root.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    const left = Math.max(0, Math.min(box.left - rootBox.left, rootBox.width - pop.offsetWidth));
    pop.style.left = `${left}px`;
    pop.style.top = `${box.bottom - rootBox.top + 4}px`;
    anchor.setAttribute('data-oict-pop-anchor', '');
    this.popover = pop;
  }

  private closePopover(): void {
    if (this.popover) {
      this.popover.remove();
      this.popover = undefined;
      this.toolbar.querySelectorAll('[data-oict-pop-anchor]').forEach(n => n.removeAttribute('data-oict-pop-anchor'));
    }
  }

  private openSwatches(anchor: HTMLElement, colors: string[], noneLabel: string,
    pick: (c: string) => void, clear: () => void): void {
    const doc = this.root.ownerDocument;
    const wrap = doc.createElement('div');
    const none = doc.createElement('button');
    none.type = 'button';
    none.className = 'oict-pop-btn';
    none.textContent = noneLabel;
    none.addEventListener('click', () => { clear(); this.closePopover(); });
    const grid = doc.createElement('div');
    grid.className = 'oict-swatches';
    grid.style.padding = '4px 2px 2px';
    for (const c of colors) {
      const s = doc.createElement('button');
      s.type = 'button';
      s.className = 'oict-swatch';
      s.style.background = c;
      s.title = c;
      s.setAttribute('aria-label', c);
      s.addEventListener('mousedown', (ev: MouseEvent) => ev.preventDefault());
      s.addEventListener('click', () => { pick(c); this.closePopover(); });
      grid.appendChild(s);
    }
    wrap.appendChild(none);
    wrap.appendChild(grid);
    this.openPopover(anchor, wrap);
  }

  private openTableMenu(anchor: HTMLElement): void {
    const e = this.editor;
    const doc = this.root.ownerDocument;
    const wrap = doc.createElement('div');
    const items: Array<[string, () => boolean, () => boolean]> = [
      ['แทรกตาราง 3 × 3', () => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run(), () => !e.isActive('table')],
      ['เพิ่มแถวด้านบน', () => e.chain().focus().addRowBefore().run(), () => e.can().addRowBefore()],
      ['เพิ่มแถวด้านล่าง', () => e.chain().focus().addRowAfter().run(), () => e.can().addRowAfter()],
      ['เพิ่มคอลัมน์ด้านซ้าย', () => e.chain().focus().addColumnBefore().run(), () => e.can().addColumnBefore()],
      ['เพิ่มคอลัมน์ด้านขวา', () => e.chain().focus().addColumnAfter().run(), () => e.can().addColumnAfter()],
      ['สลับแถวหัวตาราง', () => e.chain().focus().toggleHeaderRow().run(), () => e.can().toggleHeaderRow()],
      ['ลบแถว', () => e.chain().focus().deleteRow().run(), () => e.can().deleteRow()],
      ['ลบคอลัมน์', () => e.chain().focus().deleteColumn().run(), () => e.can().deleteColumn()],
      ['ลบตาราง', () => e.chain().focus().deleteTable().run(), () => e.can().deleteTable()]
    ];
    for (const [label, run, enabled] of items) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'oict-pop-btn';
      b.textContent = label;
      b.disabled = !enabled();
      b.addEventListener('mousedown', (ev: MouseEvent) => ev.preventDefault());
      b.addEventListener('click', () => { run(); this.closePopover(); });
      wrap.appendChild(b);
    }
    this.openPopover(anchor, wrap);
  }

  // ---------- link dialog ----------

  public openLinkPanel(): void {
    const e = this.editor;
    this.syncSelectionFromDom();
    if (e.isActive('link')) {
      e.chain().extendMarkRange('link').run();
    }
    const { from, to } = e.state.selection;
    this.linkRange = { from, to };
    const current = e.isActive('link') ? (e.getAttributes('link') as { href?: string; target?: string }) : {};
    const selectedText = e.state.doc.textBetween(from, to, ' ');
    const href = current.href || '';

    const doc = this.root.ownerDocument;
    const panel = doc.createElement('div');
    panel.innerHTML = `
      <h3>${href ? 'แก้ไขลิงก์' : 'แทรกลิงก์'}</h3>
      <label for="oict-addr">ที่อยู่</label>
      <input id="oict-addr" type="text" autocomplete="off" placeholder="https://example.com" />
      <label for="oict-text">ข้อความที่จะแสดง</label>
      <input id="oict-text" type="text" autocomplete="off" />
      <label class="oict-check" style="margin-top:12px"><input id="oict-chrome" type="checkbox" />เปิดด้วย Chrome</label>
      <div class="oict-hint">ใส่ nasarut-inchrome-chrome: หน้าลิงก์ให้อัตโนมัติ</div>
      <label class="oict-check" style="margin-top:8px"><input id="oict-newtab" type="checkbox" />เปิดในแท็บใหม่</label>
      <div class="oict-err" role="alert" hidden></div>
      <div class="oict-actions">
        <button type="button" class="oict-primary" data-act="save">บันทึก</button>
        <button type="button" data-act="cancel">ยกเลิก</button>
        ${href ? '<button type="button" class="oict-danger" data-act="remove">เอาลิงก์ออก</button>' : ''}
      </div>`;

    const addr = panel.querySelector('#oict-addr') as HTMLInputElement;
    const text = panel.querySelector('#oict-text') as HTMLInputElement;
    const chrome = panel.querySelector('#oict-chrome') as HTMLInputElement;
    const newTab = panel.querySelector('#oict-newtab') as HTMLInputElement;
    const err = panel.querySelector('.oict-err') as HTMLDivElement;

    addr.value = stripChrome(href);
    text.value = selectedText;
    chrome.checked = isChromeHref(href);
    newTab.checked = current.target === '_blank';
    const syncNewTab = (): void => {
      newTab.disabled = chrome.checked;
      if (chrome.checked) { newTab.checked = false; }
    };
    syncNewTab();
    chrome.addEventListener('change', syncNewTab);
    [addr, text].forEach(i => i.addEventListener('input', () => { err.hidden = true; }));
    chrome.addEventListener('change', () => { err.hidden = true; });

    const save = (): void => {
      const result = buildHref(addr.value, chrome.checked);
      if (!result.ok || !result.href) {
        err.textContent = result.error || 'ลิงก์ไม่ถูกต้อง';
        err.hidden = false;
        addr.focus();
        return;
      }
      this.applyLink(result.href, chrome.checked ? null : (newTab.checked ? '_blank' : null),
        text.value, selectedText);
      this.closePopover();
    };

    panel.addEventListener('click', (ev: MouseEvent) => {
      const act = (ev.target as HTMLElement).getAttribute('data-act');
      if (act === 'save') { save(); }
      if (act === 'cancel') { this.closePopover(); e.commands.focus(); }
      if (act === 'remove' && this.linkRange) {
        e.chain().focus().setTextSelection(this.linkRange).unsetLink().run();
        this.closePopover();
      }
    });
    panel.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Enter' && (ev.target as HTMLElement).tagName === 'INPUT') { ev.preventDefault(); save(); }
    });

    const linkBtn = this.buttons.find(b => b.el.title.indexOf('Ctrl+K') >= 0);
    this.openPopover(linkBtn ? linkBtn.el : this.toolbar, panel, 'oict-link');
    addr.focus();
  }

  /** A click followed very quickly by Ctrl+K can reach us before the editor has read the new selection. */
  private syncSelectionFromDom(): void {
    const view = this.editor.view;
    const sel = this.root.ownerDocument.getSelection();
    if (!sel || !sel.rangeCount || !sel.anchorNode || !sel.focusNode ||
        !view.dom.contains(sel.anchorNode) || !view.dom.contains(sel.focusNode)) {
      return;
    }
    try {
      const a = view.posAtDOM(sel.anchorNode, sel.anchorOffset);
      const b = view.posAtDOM(sel.focusNode, sel.focusOffset);
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      const current = this.editor.state.selection;
      if (current.from !== from || current.to !== to) {
        this.editor.commands.setTextSelection({ from, to });
      }
    } catch {
      // Keep the editor's own selection.
    }
  }

  private applyLink(href: string, target: string | null, newText: string, oldText: string): void {
    const e = this.editor;
    const range = this.linkRange || e.state.selection;
    const attrs = { href, target };
    const label = newText.trim();

    if (range.from !== range.to && (label === '' || label === oldText)) {
      e.chain().focus().setTextSelection(range).extendMarkRange('link').setLink(attrs).run();
      return;
    }

    // New text: keep the formatting of the replaced text (bold, colour, size ...).
    const marks = e.state.doc.resolve(range.from + (range.from !== range.to ? 1 : 0)).marks()
      .filter(m => m.type.name !== 'link')
      .map(m => ({ type: m.type.name, attrs: m.attrs }));
    marks.push({ type: 'link', attrs });
    e.chain().focus()
      .insertContentAt(range, { type: 'text', text: label || stripChrome(href), marks })
      .unsetMark('link')
      .run();
  }
}

/** Read view used when the page is not in edit mode. */
export function renderView(host: HTMLElement, html: string): void {
  ensureStyles(host.ownerDocument);
  const view = host.ownerDocument.createElement('div');
  view.className = 'oict oict-content';
  view.innerHTML = sanitizeHtml(html);
  host.replaceChildren(view);
}
