/** "More custom colors" dialog: saturation/value square, hue slider, Hex and RGB fields. */

interface IHsv { h: number; s: number; v: number; }

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hsvToRgb({ h, s, v }: IHsv): [number, number, number] {
  const f = (n: number): number => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHsv(r: number, g: number, b: number): IHsv {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) { h = ((g - b) / d) % 6; }
    else if (max === g) { h = (b - r) / d + 2; }
    else { h = (r - g) / d + 4; }
    h *= 60;
    if (h < 0) { h += 360; }
  }
  return { h, s: max ? d / max : 0, v: max };
}

function toHex(rgb: [number, number, number]): string {
  return rgb.map(n => (n < 16 ? '0' : '') + n.toString(16)).join('');
}

function parseHex(hex: string): [number, number, number] | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) { return undefined; }
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const CSS: string = `
.oict-cd-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000001;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI","Leelawadee UI",Tahoma,sans-serif}
.oict-cd{background:#fff;border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,.25);padding:20px 24px;width:320px;max-width:calc(100vw - 32px);color:#323130}
.oict-cd-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.oict-cd-head h3{margin:0;font-size:18px;font-weight:600}
.oict-cd-x{width:32px;height:32px;border:0;background:transparent;border-radius:3px;cursor:pointer;font-size:18px;color:#323130}
.oict-cd-x:hover{background:#f3f2f1}
.oict-cd-sv{position:relative;height:200px;border-radius:2px;cursor:crosshair;touch-action:none}
.oict-cd-sv::before,.oict-cd-sv::after{content:"";position:absolute;inset:0;border-radius:2px}
.oict-cd-sv::before{background:linear-gradient(to right,#fff,rgba(255,255,255,0))}
.oict-cd-sv::after{background:linear-gradient(to top,#000,rgba(0,0,0,0))}
.oict-cd-thumb{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.4);z-index:1;pointer-events:none}
.oict-cd-row{display:flex;align-items:center;gap:12px;margin-top:14px}
.oict-cd-hue{position:relative;flex:1;height:14px;border-radius:7px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);cursor:pointer;touch-action:none}
.oict-cd-hue .oict-cd-thumb{top:7px;background:#fff}
.oict-cd-preview{width:44px;height:44px;border-radius:2px;border:1px solid #c8c6c4;flex:none}
.oict-cd-fields{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:8px;margin-top:14px}
.oict-cd-fields label{display:block;font-size:12px;margin-bottom:4px}
.oict-cd-fields input{width:100%;box-sizing:border-box;height:30px;border:1px solid #8a8886;border-radius:2px;padding:0 6px;font:inherit;font-size:13px}
.oict-cd-fields input:focus{outline:2px solid #0078d4;outline-offset:-1px;border-color:transparent}
.oict-cd-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
.oict-cd-actions button{height:32px;min-width:80px;padding:0 16px;border-radius:2px;border:1px solid #8a8886;background:#fff;font:inherit;font-weight:600;cursor:pointer}
.oict-cd-actions .oict-cd-ok{background:#0078d4;border-color:#0078d4;color:#fff}
`;

let styled: boolean = false;

/** Opens the dialog. Resolves with "#rrggbb", or undefined when cancelled. */
export function openColorDialog(doc: Document, initial: string = '#ff0000'): Promise<string | undefined> {
  if (!styled) {
    styled = true;
    const st = doc.createElement('style');
    st.textContent = CSS;
    doc.head.appendChild(st);
  }

  return new Promise((resolve) => {
    let hsv = rgbToHsv(...(parseHex(initial) || [255, 0, 0]));
    const backdrop = doc.createElement('div');
    backdrop.className = 'oict-cd-backdrop';
    backdrop.innerHTML = `
      <div class="oict-cd" role="dialog" aria-modal="true" aria-labelledby="oict-cd-title">
        <div class="oict-cd-head"><h3 id="oict-cd-title">สีที่กำหนดเอง</h3><button type="button" class="oict-cd-x" aria-label="ปิด">✕</button></div>
        <div class="oict-cd-sv" aria-label="ความอิ่มตัวและความสว่าง"><span class="oict-cd-thumb"></span></div>
        <div class="oict-cd-row"><div class="oict-cd-hue" aria-label="เฉดสี"><span class="oict-cd-thumb"></span></div><div class="oict-cd-preview"></div></div>
        <div class="oict-cd-fields">
          <div><label for="oict-cd-hex">Hex</label><input id="oict-cd-hex" maxlength="7" autocomplete="off" /></div>
          <div><label for="oict-cd-r">Red</label><input id="oict-cd-r" inputmode="numeric" maxlength="3" /></div>
          <div><label for="oict-cd-g">Green</label><input id="oict-cd-g" inputmode="numeric" maxlength="3" /></div>
          <div><label for="oict-cd-b">Blue</label><input id="oict-cd-b" inputmode="numeric" maxlength="3" /></div>
        </div>
        <div class="oict-cd-actions"><button type="button" class="oict-cd-ok">ตกลง</button><button type="button" class="oict-cd-cancel">ยกเลิก</button></div>
      </div>`;
    doc.body.appendChild(backdrop);

    const q = <T extends Element>(s: string): T => backdrop.querySelector(s) as T;
    const sv = q<HTMLDivElement>('.oict-cd-sv');
    const svThumb = sv.querySelector('.oict-cd-thumb') as HTMLSpanElement;
    const hue = q<HTMLDivElement>('.oict-cd-hue');
    const hueThumb = hue.querySelector('.oict-cd-thumb') as HTMLSpanElement;
    const preview = q<HTMLDivElement>('.oict-cd-preview');
    const hexIn = q<HTMLInputElement>('#oict-cd-hex');
    const rIn = q<HTMLInputElement>('#oict-cd-r');
    const gIn = q<HTMLInputElement>('#oict-cd-g');
    const bIn = q<HTMLInputElement>('#oict-cd-b');

    const paint = (skip?: HTMLInputElement): void => {
      const rgb = hsvToRgb(hsv);
      const hex = toHex(rgb);
      sv.style.background = `hsl(${hsv.h}, 100%, 50%)`;
      svThumb.style.left = `${hsv.s * 100}%`;
      svThumb.style.top = `${(1 - hsv.v) * 100}%`;
      hueThumb.style.left = `${(hsv.h / 360) * 100}%`;
      preview.style.background = `#${hex}`;
      if (skip !== hexIn) { hexIn.value = hex; }
      if (skip !== rIn) { rIn.value = String(rgb[0]); }
      if (skip !== gIn) { gIn.value = String(rgb[1]); }
      if (skip !== bIn) { bIn.value = String(rgb[2]); }
    };

    const drag = (target: HTMLElement, onMove: (x: number, y: number) => void): void => {
      target.addEventListener('pointerdown', (ev: PointerEvent) => {
        ev.preventDefault();
        target.setPointerCapture(ev.pointerId);
        const move = (e: PointerEvent): void => {
          const box = target.getBoundingClientRect();
          onMove(clamp((e.clientX - box.left) / box.width, 0, 1), clamp((e.clientY - box.top) / box.height, 0, 1));
        };
        move(ev);
        const up = (): void => {
          target.removeEventListener('pointermove', move);
          target.removeEventListener('pointerup', up);
        };
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', up);
      });
    };
    drag(sv, (x, y) => { hsv = { ...hsv, s: x, v: 1 - y }; paint(); });
    drag(hue, (x) => { hsv = { ...hsv, h: Math.min(359.9, x * 360) }; paint(); });

    hexIn.addEventListener('input', () => {
      const rgb = parseHex(hexIn.value);
      if (rgb) { hsv = rgbToHsv(...rgb); paint(hexIn); }
    });
    [rIn, gIn, bIn].forEach((input) => input.addEventListener('input', () => {
      const vals = [rIn, gIn, bIn].map(i => parseInt(i.value, 10));
      if (vals.every(v => v >= 0 && v <= 255)) {
        hsv = rgbToHsv(vals[0], vals[1], vals[2]);
        paint(input);
      }
    }));

    function close(value: string | undefined): void {
      backdrop.remove();
      doc.removeEventListener('keydown', onKey, true);
      resolve(value);
    }
    function onKey(ev: KeyboardEvent): void {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(undefined); }
    }
    doc.addEventListener('keydown', onKey, true);
    q<HTMLButtonElement>('.oict-cd-ok').addEventListener('click', () => close(`#${toHex(hsvToRgb(hsv))}`));
    q<HTMLButtonElement>('.oict-cd-cancel').addEventListener('click', () => close(undefined));
    q<HTMLButtonElement>('.oict-cd-x').addEventListener('click', () => close(undefined));
    backdrop.addEventListener('mousedown', (ev: MouseEvent) => { if (ev.target === backdrop) { close(undefined); } });

    paint();
    hexIn.focus();
    hexIn.select();
  });
}
