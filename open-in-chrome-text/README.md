# Text (Open in Chrome)

SPFx web part (SharePoint Online) ที่แก้ข้อความบนหน้าเพจได้เหมือน Text web part
และตอนใส่ลิงก์ติ๊ก **"เปิดด้วย Chrome"** ได้ ระบบจะเติม `nasarut-inchrome-chrome:` หน้าลิงก์ให้เอง

- SPFx 1.22.2, Node.js 22, ตัวแก้ไข TipTap 2.26.4, ตัวกรอง HTML DOMPurify 3.2.6
- ไม่มี server หรือ CDN ภายนอก (`includeClientSideAssets: true`) และไม่ขอ API permission
- `skipFeatureDeployment: false` ต้องกด Add app ทีละไซต์
- ID ของ solution / feature / web part ล็อกไว้ในไฟล์ config ห้ามเปลี่ยน ไม่อย่างนั้นอัปโหลดทับของเดิมไม่ได้

## Build

```
npm ci
npx heft build --clean --production
npx heft package-solution --production
```

ได้ไฟล์ `sharepoint/solution/open-in-chrome-text.sppkg`

## แก้ไขครั้งต่อไป

เพิ่ม `version` ใน `config/package-solution.json` (เช่น 1.0.0.0 → 1.0.1.0) ทุกครั้ง แล้วอัปโหลดทับใน App Catalog

## ไฟล์หลัก

| ไฟล์ | หน้าที่ |
|---|---|
| `src/webparts/openInChromeText/OpenInChromeTextWebPart.ts` | web part: โหมดแก้ไขเปิดตัวแก้ไข โหมดดูแสดง HTML ที่กรองแล้ว |
| `editor/RichTextEditor.ts` | แถบเครื่องมือ ตัวแก้ไข และหน้าต่างใส่ลิงก์ |
| `editor/links.ts` | กฎของลิงก์ และการเติม `nasarut-inchrome-chrome:` |
| `editor/sanitize.ts` | กรอง HTML ก่อนบันทึกและก่อนแสดง |
| `editor/FontSize.ts` | ขนาดตัวอักษร |
| `editor/styles.ts` | CSS ของตัวแก้ไขและหน้าแสดงผล |
