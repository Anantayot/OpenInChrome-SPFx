# Nasarut-inchrome

[ดูประวัติการเปลี่ยนแปลงแต่ละเวอร์ชัน (Changelog)](CHANGELOG.md)

SPFx web part สำหรับ SharePoint Online ที่แก้ข้อความบนหน้าเพจได้เหมือน Text web part
และตอนใส่ลิงก์ติ๊ก **"เปิดด้วย Chrome"** ได้ ระบบจะเติม `nasarut-inchrome-chrome:` หน้าลิงก์ให้เอง
เครื่องผู้ใช้ต้องลงทะเบียน protocol `nasarut-inchrome-chrome` ไว้แล้ว (ใช้ `Open-Chrome.ps1`)

| | |
|---|---|
| ไฟล์ติดตั้ง | [`dist/Nasarut-inchrome.sppkg`](dist/Nasarut-inchrome.sppkg) |
| ชื่อใน App Catalog | Nasarut-inchrome |
| ชื่อ web part ในหน้าเพจ | Nasarut-inchrome (กลุ่ม Advanced) |
| Solution ID | `968f0272-ec25-46a0-a351-6f35299b8d24` |
| Web part ID | `212a363a-17f4-4bde-98e0-3e855aa31402` |
| Version | `1.1.1.0` |

## โครงสร้าง repo

```
nasarut-inchrome/                       โค้ด SPFx 1.22.2 (Node.js 22)
  config/package-solution.json          ชื่อ, ID และ version ของแพ็กเกจ
  sharepoint/images/nasarut-inchrome.png   ไอคอน App Catalog (96×96)
  src/webparts/nasarutInchrome/
    NasarutInchromeWebPart.ts           web part: โหมดแก้ไขเปิดตัวแก้ไข โหมดดูแสดง HTML ที่กรองแล้ว
    editor/RichTextEditor.ts            แถบเครื่องมือ ตัวแก้ไข และหน้าต่างใส่ลิงก์
    editor/links.ts                     กฎของลิงก์ และการเติม nasarut-inchrome-chrome:
    editor/sanitize.ts                  กรอง HTML ก่อนบันทึกและก่อนแสดง
    editor/FontSize.ts, editor/styles.ts
.github/workflows/build-nasarut-inchrome.yml   build อัตโนมัติ แล้ว commit dist/Nasarut-inchrome.sppkg
dist/Nasarut-inchrome.sppkg             ไฟล์สำหรับอัปโหลดเข้า App Catalog
```

## ติดตั้ง

1. อัปโหลด `dist/Nasarut-inchrome.sppkg` เข้า App Catalog แล้วเลือก **Only enable this app**
   (ถ้ามี Nasarut-inchrome รุ่นเก่าอยู่แล้ว ให้กด **Replace**)
2. ในไซต์ → **+ New** → **App** → เพิ่ม **Nasarut-inchrome**
3. แก้หน้าเพจ → **+** → **Nasarut-inchrome** → พิมพ์ข้อความได้เลย → **Republish**

## แก้ไขโค้ด

1. แก้ไฟล์ใน `nasarut-inchrome/`
2. เพิ่ม `version` ใน `config/package-solution.json` ทุกครั้ง (เช่น 1.1.1.0 → 1.1.2.0)
3. push ขึ้น main แล้ว workflow จะ build และ commit `dist/Nasarut-inchrome.sppkg` ให้เอง
4. อัปโหลดทับใน App Catalog (**Replace**)

ห้ามเปลี่ยน Solution ID, Feature ID และ Web part ID ไม่อย่างนั้นจะอัปโหลดทับของเดิมไม่ได้

Build เองบนเครื่อง:

```
cd nasarut-inchrome
npm ci
npx heft build --clean --production
npx heft package-solution --production
```

## ความปลอดภัย

- HTML ถูกกรองด้วย DOMPurify ทั้งตอนบันทึกและตอนแสดง (ตัดสคริปต์, iframe, ฟอร์ม และ event handler)
- ลิงก์ใช้ได้เฉพาะ http, https, mailto, tel และลิงก์ที่ขึ้นต้นด้วย `/` หรือ `#`
- ลิงก์ Chrome ต้องเป็น `nasarut-inchrome-chrome:http(s)://...` ไม่มีช่องว่างหรือเครื่องหมายคำพูด (กฎเดียวกับ `Open-Chrome.ps1`)
- ไม่ใช้ server หรือ CDN ภายนอก และไม่ขอ API permission
- dependency ล็อกด้วย `package-lock.json` และ build ด้วย `npm ci`
