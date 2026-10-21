/** Styles for the editor and the read view. Injected once per page. */
const CSS: string = `
.oict{font:inherit;color:inherit;position:relative;word-wrap:break-word}
.oict-content{font-family:var(--oict-font,inherit);font-size:var(--oict-size,inherit);line-height:1.4}
.oict-content::after{content:"";display:table;clear:both}
.oict-content>:last-child,.oict-editor .ProseMirror>:last-child{margin-bottom:0}
.oict-content p{margin:0 0 1.4em;font-family:var(--oict-p-font,inherit);font-size:var(--oict-p-size,inherit);font-weight:var(--oict-p-weight,inherit)}
.oict-content h1,.oict-content h2,.oict-content h3,.oict-content h4{margin:0 0 12px;line-height:1.4}
.oict-content h1{font-family:var(--oict-h1-font,inherit);font-size:var(--oict-h1-size,28px);font-weight:var(--oict-h1-weight,600)}
.oict-content h2{font-family:var(--oict-h2-font,inherit);font-size:var(--oict-h2-size,24px);font-weight:var(--oict-h2-weight,600)}
.oict-content h3{font-family:var(--oict-h3-font,inherit);font-size:var(--oict-h3-size,20px);font-weight:var(--oict-h3-weight,600)}
.oict-content h4{font-family:var(--oict-h4-font,inherit);font-size:var(--oict-h4-size,16px);font-weight:var(--oict-h4-weight,600)}
.oict-content ul,.oict-content ol{margin:0 0 1.4em;padding-left:1.6em}
.oict-content li{margin:.15em 0}
.oict-content li>p{margin:0;line-height:var(--oict-li-line,21px)}
.oict-content li>p [style*="font-size"]{line-height:1.3}
.oict-content li>ul,.oict-content li>ol{margin-bottom:0}
.oict-content blockquote{margin:0 0 1.4em;padding:.2em 0 .2em 1em;border-left:3px solid var(--oict-border,#c8c6c4);color:var(--oict-subtle,#605e5c);font-style:italic}
.oict-content pre{font-family:Consolas,Menlo,monospace;background:var(--oict-neutral-bg,#f3f2f1);padding:8px 10px;border-radius:4px;white-space:pre-wrap}
.oict-content code{font-family:Consolas,Menlo,monospace}
.oict-content a{color:var(--oict-link,#0078d4);text-decoration:underline}
.oict-content span[style*="color"] a{color:inherit}
.oict-content a:has(span[style*="color"]){text-decoration:none}
.oict-content a span[style*="color"]{text-decoration:underline}
.oict-content [data-spacing="none"]{margin-top:0;margin-bottom:0}
.oict-content [data-space-before="true"]{margin-top:12px}
.oict-content [data-space-after="true"]{margin-bottom:12px}
.oict-content img{max-width:100%;height:auto;display:block;margin:4px 0 12px}
.oict-content img[data-align="center"]{margin-left:auto;margin-right:auto}
.oict-content img[data-align="left"]{float:left;margin:4px 16px 8px 0;max-width:100%}
.oict-content img[data-align="right"]{float:right;margin:4px 0 8px 16px;max-width:100%}
.oict-img-wrap{position:relative;display:block;width:fit-content;max-width:100%;margin:4px 0 12px;line-height:0}
.oict-img-wrap img{display:block;margin:0;width:100%;max-width:100%}
.oict-img-wrap:not([style*="width"]) img{width:auto}
.oict-img-wrap[data-align="center"]{margin-left:auto;margin-right:auto}
.oict-img-wrap[data-align="left"]{float:left;margin:4px 16px 8px 0}
.oict-img-wrap[data-align="right"]{float:right;margin:4px 0 8px 16px}
.oict-img-wrap.is-selected{outline:2px solid #0078d4;outline-offset:2px}
.oict-handle{position:absolute;width:10px;height:10px;background:#fff;border:1px solid #0078d4;border-radius:2px;display:none;z-index:2}
.oict-img-wrap.is-selected .oict-handle{display:block}
.oict-handle[data-h="nw"]{left:-6px;top:-6px;cursor:nwse-resize}
.oict-handle[data-h="ne"]{right:-6px;top:-6px;cursor:nesw-resize}
.oict-handle[data-h="sw"]{left:-6px;bottom:-6px;cursor:nesw-resize}
.oict-handle[data-h="se"]{right:-6px;bottom:-6px;cursor:nwse-resize}
.oict-img-size{position:absolute;right:4px;bottom:4px;background:rgba(0,0,0,.65);color:#fff;font:12px/1.2 "Segoe UI",sans-serif;padding:2px 6px;border-radius:3px;display:none}
.oict-img-wrap.is-resizing .oict-img-size{display:block}
.oict-content blockquote[data-quote-style="intense"]{border-left:0;border-top:2px solid var(--oict-border,#c8c6c4);border-bottom:2px solid var(--oict-border,#c8c6c4);padding:.6em 0;font-size:1.25em;font-weight:600;font-style:normal;color:var(--oict-link,#0078d4)}
.oict-content blockquote[data-quote-style="boxed"]{border:1px solid var(--oict-border,#c8c6c4);border-radius:4px;background:var(--oict-neutral-bg2,#faf9f8);padding:.8em 1em;font-style:normal;color:inherit}
.oict-content blockquote[data-quote-style="side"]{border-left:4px solid var(--oict-link,#0078d4);padding-left:1em;font-style:normal;color:inherit}
.oict-content blockquote[data-quote-style="icon"]{position:relative;border-left:0;padding-left:2.4em;font-style:normal;color:inherit}
.oict-content blockquote[data-quote-style="icon"]::before{content:"“";position:absolute;left:0;top:-.15em;font:700 2.6em/1 Georgia,serif;color:var(--oict-link,#0078d4)}
.oict-editor .ProseMirror{margin-top:8px}
.oict-content table{border-collapse:collapse;margin:0 0 1.4em;width:100%;table-layout:fixed}
.oict-content td,.oict-content th{border:1px solid var(--oict-border,#c8c6c4);padding:6px 8px;vertical-align:top;min-width:40px}
.oict-content th{background:var(--oict-neutral-bg,#f3f2f1);font-weight:600;text-align:left}
.oict-content td>p,.oict-content th>p{margin:0}
.oict-content table[data-align]{width:auto;table-layout:auto;min-width:30%;max-width:100%}
.oict-content table[data-align="left"]{margin-right:auto}
.oict-content table[data-align="center"]{margin-left:auto;margin-right:auto}
.oict-content table[data-align="right"]{margin-left:auto}
.oict-content table[data-table-style="minimal"] td,.oict-content table[data-table-style="minimal"] th{border-left:0;border-right:0}
.oict-content table[data-table-style="banded"] td,.oict-content table[data-table-style="banded"] th{border:0}
.oict-content table[data-table-style="banded"] tr:nth-child(even)>*{background:var(--oict-neutral-bg,#f3f2f1)}
.oict-content table[data-table-style="header"] td,.oict-content table[data-table-style="header"] th{border-left:0;border-right:0}
.oict-content table[data-table-style="header"] tr:first-child>*{background:var(--oict-neutral-bg,#f3f2f1);font-weight:600;border-bottom:2px solid var(--oict-subtle,#605e5c)}
.oict-content table[data-table-style^="theme-"] td,.oict-content table[data-table-style^="theme-"] th{border-color:var(--oict-theme-light,#c7e0f4)}
.oict-content table[data-table-style="theme-header"] tr:first-child>*{background:var(--oict-theme,#0078d4);color:var(--oict-theme-text,#fff);font-weight:600;border-color:var(--oict-theme,#0078d4)}
.oict-content table[data-table-style="theme-header"] tr:first-child>* a{color:inherit}
.oict-content table[data-table-style="theme-banded"] td,.oict-content table[data-table-style="theme-banded"] th{border:0}
.oict-content table[data-table-style="theme-banded"] tr:nth-child(odd)>*{background:var(--oict-theme-lighter,#eff6fc)}
.oict-content table[data-table-style="theme-banded"] tr:first-child>*{background:var(--oict-theme-light,#c7e0f4);font-weight:600}
.oict-content table[data-table-style="theme-lines"] td,.oict-content table[data-table-style="theme-lines"] th{border-left:0;border-right:0;border-color:var(--oict-theme,#0078d4)}
.oict-content table[data-table-style="theme-lines"] tr:first-child>*{color:var(--oict-theme,#0078d4);font-weight:600;border-top-width:2px;border-bottom-width:2px}
.oict-content table[data-table-style="theme-accent"] td,.oict-content table[data-table-style="theme-accent"] th{border-left:0;border-right:0}
.oict-content table[data-table-style="theme-accent"] tr:first-child>*{background:var(--oict-theme-lighter,#eff6fc);font-weight:600;border-bottom:2px solid var(--oict-theme,#0078d4)}
.oict-content h1,.oict-content h2,.oict-content h3{position:relative}
.oict-anchor{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;margin-left:.3em;vertical-align:middle;color:var(--oict-link,#0078d4);opacity:0;text-decoration:none !important;border-radius:3px;transition:opacity .1s}
.oict-anchor svg{width:.7em;height:.7em;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.oict-content h1:hover .oict-anchor,.oict-content h2:hover .oict-anchor,.oict-content h3:hover .oict-anchor,.oict-anchor:focus-visible{opacity:1}
.oict-anchor-tip{position:absolute;left:100%;top:50%;transform:translate(8px,-50%);white-space:nowrap;background:#323130;color:#fff;font:12px/1.4 "Segoe UI",sans-serif;font-weight:400;padding:3px 8px;border-radius:3px;pointer-events:none}
.oict-content mark{padding:0 1px}
.oict-toolbar{display:flex;align-items:center;gap:2px;padding:3px;border:1px solid #e1dfdd;border-radius:4px;background:#fff;position:sticky;top:0;z-index:3;width:max-content;max-width:100%;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.oict-float .oict-toolbar{visibility:hidden;opacity:0;transition:opacity .12s ease}
.oict-float:not(.oict-joined):hover .oict-toolbar,.oict-float.is-focused .oict-toolbar,.oict-float.is-selected .oict-toolbar,.oict-float.has-popover .oict-toolbar{visibility:visible;opacity:1}
.oict-float .oict-toolbar{position:absolute;z-index:20;top:auto;right:auto;bottom:calc(100% + 8px);max-width:none;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.oict-float .ProseMirror{margin-top:0}
.oict-float.oict-stack .oict-toolbar{bottom:calc(100% + 56px)}
.oict-float.oict-joined .oict-toolbar{transition:none}
.oict-toolbar.oict-layer-tb{position:fixed !important;bottom:auto !important;right:auto !important;z-index:999980;visibility:hidden;opacity:0;transition:none;max-width:none;font-family:"Segoe UI","Leelawadee UI",Tahoma,sans-serif;font-size:14px;line-height:1.3;color:#323130;text-align:left;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.oict-toolbar.oict-layer-tb.oict-shown{visibility:visible;opacity:1}
.oict-toolbar.oict-layer-tb.oict-stuck{box-shadow:0 2px 8px rgba(0,0,0,.18)}
@media (prefers-reduced-motion:reduce){.oict-float .oict-toolbar{transition:none}}
.oict-btn,.oict-drop{height:32px;display:inline-flex;align-items:center;justify-content:center;gap:4px;border:0;border-radius:3px;background:transparent;color:var(--oict-ui-text,#323130);cursor:pointer;font:inherit;font-size:14px;padding:0 6px;white-space:nowrap}
.oict-btn{width:32px;padding:0}
.oict-btn:hover,.oict-drop:hover,.oict-btn[data-oict-pop-anchor],.oict-drop[data-oict-pop-anchor]{background:#f3f2f1}
.oict-btn.is-active{color:#005a9e;background:#edebe9}
.oict-btn:focus-visible,.oict-drop:focus-visible,.oict-item:focus-visible{outline:2px solid #0078d4;outline-offset:-2px}
.oict-btn svg,.oict-drop svg,.oict-item svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
.oict-drop svg{width:12px;height:12px}
.oict-drop-style{min-width:118px;justify-content:space-between;border:1px solid transparent}
@media (max-width:520px){.oict-drop-style{min-width:0;max-width:112px}.oict-drop-style .oict-drop-label{overflow:hidden;text-overflow:ellipsis;max-width:80px}.oict-drop-size{min-width:50px}}
.oict-drop-size{min-width:58px;height:28px;justify-content:space-between;border:1px solid #c8c6c4;border-radius:4px;margin:0 2px}
.oict-drop-size:hover{border-color:#8a8886}
.oict-drop-label{overflow:hidden;text-overflow:ellipsis;max-width:150px}
.oict-editor .ProseMirror{min-height:90px;outline:none;padding:10px 4px}
.oict-editor .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:#a19f9d;float:left;height:0;pointer-events:none}
.oict-editor .ProseMirror .selectedCell{background:#deecf9}
.oict-editor .tableWrapper{overflow-x:auto}
.oict-editor a[href^="nasarut-inchrome-chrome:" i]::after{content:"Chrome";display:inline-block;margin-left:4px;padding:0 5px;font:600 10px/15px Segoe UI,sans-serif;border-radius:3px;background:#deecf9;color:#004578;vertical-align:1px;text-decoration:none;font-style:normal}
.oict-pop{position:absolute;z-index:30;background:#fff;border:1px solid #e1dfdd;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.08);padding:4px}
.oict-menu{display:flex;flex-direction:column;min-width:180px;max-height:min(70vh,560px);overflow-y:auto}
.oict-more{width:272px;max-width:calc(100vw - 40px)}
.oict-size-menu{min-width:96px;max-height:320px}
.oict-item{display:flex;align-items:center;gap:6px;width:100%;min-height:32px;padding:3px 8px 3px 4px;border:0;border-radius:4px;background:transparent;color:#323130;font:inherit;font-size:13px;line-height:1.3;text-align:left;cursor:pointer;white-space:nowrap}
.oict-item:hover{background:#f3f2f1}
.oict-item:disabled{color:#a19f9d;cursor:default;background:transparent}
.oict-check{width:16px;display:inline-flex;flex:none;color:#323130}
.oict-icon{width:18px;display:inline-flex;flex:none;color:#605e5c}
.oict-label{flex:1;overflow:hidden;text-overflow:ellipsis}
.oict-key{margin-left:10px;color:#605e5c;font-size:11px;display:inline-flex;align-items:center;white-space:normal;text-align:right;max-width:110px;line-height:1.3}
.oict-section{padding:8px 8px 3px 28px;font-size:12px;font-weight:600;color:#323130}
.oict-divider{height:1px;background:#edebe9;margin:4px 0}
.oict-back .oict-label{font-weight:600}
.oict-swatches{display:grid;gap:8px;padding:6px 14px 10px}
.oict-swatch{width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,0,0,.25);cursor:pointer;padding:0}
.oict-swatch:hover,.oict-swatch:focus-visible{outline:2px solid #323130;outline-offset:2px}
.oict-swatch.is-current{outline:2px solid #323130;outline-offset:2px}
.oict-color-panel{min-width:0}
.oict-color-panel .oict-section,.oict-grid-panel .oict-section{padding-left:14px}
.oict-row{display:flex;align-items:stretch;border-radius:4px}
.oict-row>.oict-item{flex:1;min-width:0}
.oict-row.is-open>.oict-item,.oict-row.is-open>.oict-split-arrow{background:#f3f2f1}
.oict-split>.oict-item{border-radius:4px 0 0 4px}
.oict-split-arrow{width:30px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:0;border-left:1px solid #edebe9;border-radius:0 4px 4px 0;background:transparent;color:#605e5c;cursor:pointer;padding:0}
.oict-split-arrow:hover{background:#edebe9}
.oict-split-arrow svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.oict-split-arrow:focus-visible{outline:2px solid #0078d4;outline-offset:-2px}
.oict-imgbar{display:flex;align-items:center;gap:2px;padding:3px;background:#fff;border:1px solid #e1dfdd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.14)}
.oict-imgbar .oict-sep{width:1px;height:20px;background:#e1dfdd;margin:0 3px}
.oict-imgbar .oict-btn.is-active{background:#edebe9}
.oict-upload-status{padding:6px 10px;background:#323130;color:#fff;border-radius:4px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.oict-tstyle-grid{display:grid;grid-template-columns:repeat(4,64px);gap:8px;padding:6px 10px 10px}
.oict-tstyle{display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px;border:1px solid transparent;border-radius:4px;cursor:pointer;background:transparent;font-size:11px;color:#323130}
.oict-tstyle:hover,.oict-tstyle:focus-visible{border-color:#8a8886;outline:none}
.oict-tstyle.is-on{border-color:#0078d4;background:#eff6fc}
.oict-tstyle .oict-content{font-size:6px;line-height:1;pointer-events:none;width:56px}
.oict-tstyle .oict-content table{margin:0;table-layout:fixed;width:56px}
.oict-tstyle .oict-content td{height:7px;padding:0;min-width:0}
.oict-layer{position:fixed !important;z-index:999990;font-family:"Segoe UI","Leelawadee UI",Tahoma,sans-serif;color:#323130;font-size:14px;line-height:1.3;text-align:left}
.oict-layer.oict-flyout{z-index:999991}
.oict-flyout{max-height:min(70vh,520px);overflow-y:auto}
.oict-flyout .oict-menu{max-height:none;overflow:visible}
.oict-lang{min-width:200px}
.oict-start-row{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 30px;font-size:13px;color:#323130}
.oict-start-row label{white-space:nowrap}
.oict-start-row input{width:64px;height:28px;box-sizing:border-box;border:1px solid #8a8886;border-radius:2px;padding:0 6px;font:inherit}
.oict-start-row input:disabled{background:#f3f2f1;color:#a19f9d;border-color:#c8c6c4}
.oict-mini{height:28px;padding:0 10px;border:1px solid #8a8886;border-radius:2px;background:#fff;font:inherit;font-size:13px;cursor:pointer}
.oict-mini:disabled{color:#a19f9d;border-color:#c8c6c4;cursor:default}
.oict-grid-panel{padding:0 10px 10px}
.oict-grid{display:grid;gap:2px}
.oict-cell{width:18px;height:18px;border:1px solid #c8c6c4;border-radius:2px;background:#fff;padding:0;cursor:pointer}
.oict-cell.is-on{background:#c7e0f4;border-color:#0078d4}
.oict-cell:focus-visible{outline:2px solid #0078d4}
.oict.is-painting .ProseMirror{cursor:copy}
.oict-field{width:100%;height:32px;border:1px solid #8a8886;border-radius:2px;padding:0 6px;font:inherit;background:#fff}
.oict-link{width:340px;max-width:calc(100vw - 48px);padding:14px 16px;font-size:13px;color:#323130}
.oict-link h3{margin:0 0 10px;font-size:16px;font-weight:600}
.oict-link label{display:block;margin:8px 0 4px;font-weight:600}
.oict-link input[type=text]{width:100%;box-sizing:border-box;height:32px;border:1px solid #8a8886;border-radius:2px;padding:0 8px;font:inherit}
.oict-link input[type=text]:focus{outline:2px solid #0078d4;outline-offset:-1px;border-color:transparent}
.oict-check-row{display:flex !important;align-items:center;gap:8px;font-weight:400 !important;cursor:pointer}
.oict-check-row input{width:16px;height:16px;margin:0}
.oict-hint{color:#605e5c;font-size:12px;margin:2px 0 0 24px}
.oict-err{color:#a4262c;font-size:12px;margin-top:8px}
.oict-actions{display:flex;gap:8px;margin-top:14px}
.oict-actions button{height:32px;padding:0 14px;border-radius:2px;border:1px solid #8a8886;background:#fff;font:inherit;font-weight:600;cursor:pointer}
.oict-actions .oict-primary{background:#0078d4;border-color:#0078d4;color:#fff}
.oict-actions .oict-danger{margin-left:auto;border-color:transparent;color:#a4262c}
.oict-ld-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Segoe UI","Leelawadee UI",Tahoma,sans-serif}
.oict-ld{background:#fff;color:#323130;border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,.25);width:500px;max-width:100%;max-height:calc(100vh - 32px);overflow-y:auto;padding:20px 24px 22px;font-size:14px;box-sizing:border-box}
.oict-ld-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.oict-ld-head h3{margin:0;font-size:20px;font-weight:600}
.oict-ld-x{width:32px;height:32px;border:0;border-radius:3px;background:transparent;font-size:18px;color:#323130;cursor:pointer}
.oict-ld-x:hover{background:#f3f2f1}
.oict-ld label{display:block;margin:10px 0 4px;font-size:14px}
.oict-ld input[type=text],.oict-ld input[type=search]{width:100%;box-sizing:border-box;height:32px;border:1px solid #8a8886;border-radius:2px;padding:0 8px;font:inherit;font-size:14px;color:#323130;background:#fff}
.oict-ld input[type=text]:focus,.oict-ld input[type=search]:focus{outline:2px solid #0078d4;outline-offset:-1px;border-color:transparent}
.oict-ld-gap{margin-top:18px !important}
.oict-ld-listhead{margin:10px 0 6px;font-weight:600}
.oict-ld-list{border:1px solid #c8c6c4;border-radius:2px;height:200px;overflow-y:auto}
.oict-ld-list table{width:100%;border-collapse:collapse;table-layout:fixed}
.oict-ld-list th{text-align:left;font-weight:600;padding:12px 12px 8px;border-bottom:1px solid #edebe9;position:sticky;top:0;background:#fff}
.oict-ld-list th:last-child,.oict-ld-date{width:130px}
.oict-ld-list td{padding:8px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.oict-ld-list tbody tr{cursor:pointer}
.oict-ld-list tbody tr:hover{background:#f3f2f1}
.oict-ld-list tbody tr.is-selected{background:#deecf9}
.oict-ld-list tbody tr:focus-visible{outline:2px solid #0078d4;outline-offset:-2px}
.oict-ld-title{color:#0f5c94}
.oict-ld-date{color:#605e5c}
.oict-ld-status{padding:10px 12px;color:#605e5c;font-size:13px}
.oict-ld-status:empty{display:none}
.oict-toggle{display:flex !important;align-items:center;gap:10px;cursor:pointer;margin:10px 0 0 !important}
.oict-toggle input{position:absolute;opacity:0;width:1px;height:1px}
.oict-switch{width:40px;height:20px;border:1px solid #605e5c;border-radius:10px;position:relative;flex:none;box-sizing:border-box;background:#fff;transition:background .12s}
.oict-switch::after{content:"";position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#605e5c;transition:left .12s}
.oict-toggle input:checked+.oict-switch{background:#0078d4;border-color:#0078d4}
.oict-toggle input:checked+.oict-switch::after{left:23px;background:#fff}
.oict-toggle input:focus-visible+.oict-switch{outline:2px solid #0078d4;outline-offset:2px}
.oict-ld-hint{margin:2px 0 0 50px;font-size:12px;color:#605e5c}
.oict-ld .oict-err{margin-top:10px;font-size:13px}
.oict-ld-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
.oict-ld-actions button{height:32px;min-width:80px;padding:0 16px;border-radius:2px;border:1px solid #8a8886;background:#fff;color:#323130;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.oict-ld-actions .oict-primary{background:#0078d4;border-color:#0078d4;color:#fff}
.oict-ld-actions .oict-primary:disabled{background:#f3f2f1;border-color:#f3f2f1;color:#a19f9d;cursor:default}
.oict-ld-actions .oict-ld-remove{margin-right:auto;border-color:transparent;color:#a4262c;padding:0 8px}
@media (prefers-reduced-motion:reduce){.oict-switch,.oict-switch::after{transition:none}}
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
