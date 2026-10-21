/** Styles for the editor and the read view. Injected once per page. */
const CSS: string = `
.oict{font:inherit;color:inherit;position:relative;word-wrap:break-word}
.oict-content p{margin:0 0 .6em}
.oict-content h1{font-size:28px;font-weight:600;margin:.4em 0 .3em;line-height:1.25}
.oict-content h2{font-size:24px;font-weight:600;margin:.4em 0 .3em;line-height:1.25}
.oict-content h3{font-size:20px;font-weight:600;margin:.4em 0 .3em;line-height:1.3}
.oict-content h4{font-size:16px;font-weight:600;margin:.4em 0 .3em;line-height:1.3}
.oict-content ul,.oict-content ol{margin:0 0 .6em;padding-left:1.6em}
.oict-content li{margin:.15em 0}
.oict-content li>p{margin:0}
.oict-content blockquote{margin:.4em 0;padding:.2em 0 .2em 1em;border-left:3px solid #c8c6c4;color:#605e5c;font-style:italic}
.oict-content pre{font-family:Consolas,Menlo,monospace;background:#f3f2f1;padding:8px 10px;border-radius:4px;white-space:pre-wrap}
.oict-content code{font-family:Consolas,Menlo,monospace}
.oict-content a{color:var(--oict-link,#0078d4);text-decoration:underline}
.oict-content table{border-collapse:collapse;margin:.4em 0;width:100%;table-layout:fixed}
.oict-content td,.oict-content th{border:1px solid #c8c6c4;padding:6px 8px;vertical-align:top;min-width:40px}
.oict-content th{background:#f3f2f1;font-weight:600;text-align:left}
.oict-content td>p,.oict-content th>p{margin:0}
.oict-content mark{padding:0 1px}
.oict-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:4px;border:1px solid #e1dfdd;border-radius:4px;background:#fff;position:sticky;top:0;z-index:3}
.oict-btn{position:relative;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:#323130;cursor:pointer;font:600 14px/1 inherit;padding:0}
.oict-btn:hover{background:#f3f2f1}
.oict-btn.is-active{background:#e1dfdd;color:#005a9e}
.oict-btn:disabled{color:#c8c6c4;cursor:default;background:transparent}
.oict-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.oict-btn .oict-bar{position:absolute;left:8px;right:8px;bottom:5px;height:3px;border-radius:1px}
.oict-select{height:32px;border:1px solid transparent;border-radius:4px;background:transparent;color:#323130;font:inherit;font-size:13px;padding:0 4px;cursor:pointer}
.oict-select:hover{background:#f3f2f1}
.oict-sep{width:1px;height:22px;background:#e1dfdd;margin:0 3px}
.oict-editor .ProseMirror{min-height:90px;outline:none;padding:10px 4px}
.oict-editor .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:#a19f9d;float:left;height:0;pointer-events:none}
.oict-editor .ProseMirror .selectedCell{background:#deecf9}
.oict-editor .tableWrapper{overflow-x:auto}
.oict-editor a[href^="nasarut-inchrome-chrome:" i]::after{content:"Chrome";display:inline-block;margin-left:4px;padding:0 5px;font:600 10px/15px Segoe UI,sans-serif;border-radius:3px;background:#deecf9;color:#004578;vertical-align:1px;text-decoration:none;font-style:normal}
.oict-pop{position:absolute;z-index:10;background:#fff;border:1px solid #e1dfdd;border-radius:4px;box-shadow:0 6px 16px rgba(0,0,0,.14);padding:8px}
.oict-swatches{display:grid;grid-template-columns:repeat(6,24px);gap:6px}
.oict-swatch{width:24px;height:24px;border-radius:3px;border:1px solid rgba(0,0,0,.15);cursor:pointer;padding:0}
.oict-swatch:hover{outline:2px solid #0078d4;outline-offset:1px}
.oict-pop-btn{display:block;width:100%;text-align:left;border:0;background:transparent;padding:7px 10px;border-radius:3px;font:inherit;font-size:13px;color:#323130;cursor:pointer;white-space:nowrap}
.oict-pop-btn:hover{background:#f3f2f1}
.oict-pop-btn:disabled{color:#c8c6c4;cursor:default;background:transparent}
.oict-link{width:340px;max-width:calc(100vw - 48px);padding:14px 16px;font-size:13px;color:#323130}
.oict-link h3{margin:0 0 10px;font-size:16px;font-weight:600}
.oict-link label{display:block;margin:8px 0 4px;font-weight:600}
.oict-link input[type=text]{width:100%;box-sizing:border-box;height:32px;border:1px solid #8a8886;border-radius:2px;padding:0 8px;font:inherit}
.oict-link input[type=text]:focus{outline:2px solid #0078d4;outline-offset:-1px;border-color:transparent}
.oict-check{display:flex !important;align-items:center;gap:8px;font-weight:400 !important;cursor:pointer}
.oict-check input{width:16px;height:16px;margin:0}
.oict-hint{color:#605e5c;font-size:12px;margin:2px 0 0 24px}
.oict-err{color:#a4262c;font-size:12px;margin-top:8px}
.oict-actions{display:flex;gap:8px;margin-top:14px}
.oict-actions button{height:32px;padding:0 14px;border-radius:2px;border:1px solid #8a8886;background:#fff;font:inherit;font-weight:600;cursor:pointer}
.oict-actions .oict-primary{background:#0078d4;border-color:#0078d4;color:#fff}
.oict-actions .oict-danger{margin-left:auto;border-color:transparent;color:#a4262c}
`;

let injected: boolean = false;

export function ensureStyles(doc: Document = document): void {
  if (injected) {
    return;
  }
  injected = true;
  const style = doc.createElement('style');
  style.setAttribute('data-oict', '');
  style.textContent = CSS;
  doc.head.appendChild(style);
}
