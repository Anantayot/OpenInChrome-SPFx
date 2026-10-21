# ประวัติการเปลี่ยนแปลง (Changelog)

โครงการ **Nasarut-inchrome** — SharePoint Framework (SPFx) Web Part สำหรับสร้างลิงก์ที่สามารถเลือกเปิดใน Google Chrome ผ่าน Windows custom protocol `nasarut-inchrome-chrome:`

> เอกสารนี้สรุปจากประวัติ GitHub Commit และโค้ดของโครงการ ไม่ใช่บันทึกการทดสอบหรือการติดตั้งจริงบน SharePoint






## 1.2.6.0 — 21 ตุลาคม 2026 (เวอร์ชันปัจจุบัน)

**แก้ปัญหาระยะห่างบรรทัดใน Rich Text Editor**

- ยกเลิกการอ่านค่าฟอนต์ ขนาดตัวอักษร และระยะบรรทัดจาก Text Web Part ที่เพิ่มในรุ่น 1.2.5.0 เพราะอาจทำให้ข้อความบางหน้ามีระยะบรรทัดห่างเกินไป
- คืน CSS ของเนื้อหาและหัวข้อให้ใช้ค่าขนาดและระยะบรรทัดเดิมของ Nasarut-inchrome พร้อมสืบทอดฟอนต์จาก SharePoint ตามปกติ
- นำโค้ดปรับ Typography แบบไดนามิกออกและเลิกใช้ไฟล์ `editor/typography.ts`
- คง Rich Text Editor, การวางข้อความ, Toolbar และตัวเลือกเปิดด้วย Chrome
- รักษา Solution ID, Feature ID และ Web Part ID เดิมเพื่ออัปเกรดจาก 1.2.5.0 ได้

**Source:** `Nasarut-inchrome-repo(3).zip`

## 1.2.5.0 — 21/10/2026

**อัปเดตจาก ZIP ใน GitHub**

- นำ Source Code ชุดล่าสุดจาก `Nasarut-inchrome-repo.zip` มาอัปเดตและ Build ใหม่
- รักษา Solution ID, Feature ID และ Web Part ID เดิมสำหรับอัปเกรดแอป
- ไฟล์ที่เปลี่ยน: `README.md`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/typography.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/styles.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/RichTextEditor.ts`, `nasarut-inchrome/config/package-solution.json`

## 1.2.4.0 — 21/10/2026

**อัปเดตจาก ZIP ใน GitHub**

- นำ Source Code ชุดล่าสุดจาก `Nasarut-inchrome-repo.zip` มาอัปเดตและ Build ใหม่
- รักษา Solution ID, Feature ID และ Web Part ID เดิมสำหรับอัปเกรดแอป
- ไฟล์ที่เปลี่ยน: `README.md`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/styles.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/RichTextEditor.ts`

## 1.2.3.0 — 21/10/2026

**ปรับปรุง Toolbar ให้ทำงานร่วมกับ SharePoint**

- ปรับ Toolbar ของ Web Part ให้ตรวจสถานะการแสดงผลของ Toolbar SharePoint และแสดง/ซ่อนตามกันเมื่อผู้ใช้เลือกหรือเลื่อนเมาส์ผ่าน Web Part
- เพิ่มการติดตามเหตุการณ์และการเปลี่ยนแปลง DOM เพื่อจัดตำแหน่ง Toolbar ให้สัมพันธ์กับ SharePoint และหยุดการติดตามเมื่อปิด Editor
- ปรับชั้นการแสดงผลของเมนูและ Flyout เพื่อไม่ให้ถูกองค์ประกอบอื่นบนหน้า SharePoint บัง
- คงความสามารถ Rich Text Editor, การวางข้อความ และลิงก์เปิดด้วย Chrome เดิมไว้
- รักษา Solution ID, Feature ID และ Web Part ID เดิมสำหรับอัปเกรดแอป
- Build แพ็กเกจ `dist/Nasarut-inchrome.sppkg` สำเร็จจาก GitHub Actions

**ข้อควรทดสอบบน SharePoint จริง:** การแสดง/ซ่อน Toolbar บนหน้าจอแคบหรือหลายคอลัมน์ และประสิทธิภาพเมื่อมี Web Part หลายตัว

## 1.2.2.0 — 21/10/2026

**อัปเดตจาก ZIP ใน GitHub**

- นำ Source Code ชุดล่าสุดจาก `Nasarut-inchrome-repo.zip` มาอัปเดตและ Build ใหม่
- รักษา Solution ID, Feature ID และ Web Part ID เดิมสำหรับอัปเกรดแอป
- ไฟล์ที่เปลี่ยน: `nasarut-inchrome/src/webparts/nasarutInchrome/editor/RichTextEditor.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/paste.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/styles.ts`

## 1.2.1.0 — 21/10/2026

**อัปเดตจาก ZIP ใน GitHub**

- นำ Source Code ชุดล่าสุดจาก `Nasarut-inchrome-repo.zip` มาอัปเดตและ Build ใหม่
- รักษา Solution ID, Feature ID และ Web Part ID เดิมสำหรับอัปเกรดแอป
- ไฟล์ที่เปลี่ยน: `README.md`, `nasarut-inchrome/config/package-solution.json`, `nasarut-inchrome/src/webparts/nasarutInchrome/NasarutInchromeWebPart.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/RichTextEditor.ts`, `nasarut-inchrome/src/webparts/nasarutInchrome/editor/styles.ts`

## 1.2.0.0 — 21 ตุลาคม 2026

**เพิ่มเครื่องมือจัดรูปแบบข้อความขั้นสูงใน Rich Text Editor**

- เพิ่มเมนูรูปแบบข้อความ หัวข้อ คำพูด และเครื่องมือจัดรูปแบบจำนวนมาก
- เพิ่มการเลือกสีตัวอักษรและไฮไลต์ รวมถึงสีธีมของ SharePoint และการกำหนดสีเอง
- เพิ่มรายการสัญลักษณ์ รายการลำดับเลข การเยื้อง และการปรับระยะห่างบรรทัดหรือย่อหน้า
- เพิ่มการแทรกรูปภาพและตาราง พร้อมการจัดรูปแบบที่เกี่ยวข้อง
- ปรับการตรวจสอบลิงก์ รูปภาพ และการกรอง HTML/CSS ก่อนบันทึกหรือแสดงผล
- เพิ่มตัวเลือกเปิดลิงก์ในแท็บใหม่ โดยยังคงตัวเลือกเปิดด้วย Chrome ผ่าน custom protocol
- คง Solution ID, Feature ID และ Web Part ID ของรุ่น 1.1.1.0

**แหล่งที่มา:** `Nasarut-inchrome-repo(2).zip` ที่อัปโหลดสำหรับเวอร์ชันนี้

## 1.1.1.0 — 21 ตุลาคม 2026

**ปรับปรุงไอคอนและรายละเอียดแพ็กเกจ**

- เพิ่มไอคอนเฉพาะของแอปสำหรับแสดงใน SharePoint App Catalog
- เปลี่ยนไอคอนของ Web Part จากสัญลักษณ์มาตรฐานเป็นภาพไอคอนเฉพาะ
- อัปเดตเวอร์ชัน Solution และ Feature จาก `1.1.0.0` เป็น `1.1.1.0`
- คงการทำงานของ Rich Text Editor และตัวเลือก **เปิดด้วย Chrome** เหมือนรุ่น 1.1.0.0
- คง Solution ID, Feature ID และ Web Part ID เดิมของรุ่น 1.1.0.0 เพื่อรองรับการอัปเดตแพ็กเกจเดิม

**Commit:** [Upgrade Nasarut-inchrome to 1.1.1.0 with custom icons](https://github.com/Anantayot/OpenInChrome-SPFx/commit/fe5b83eca50c8874b5eb831466ea86634d265f92)

## 1.1.0.0 — 21 ตุลาคม 2026

**ปรับปรุงครั้งใหญ่: จากลิงก์เดี่ยวเป็น Web Part สำหรับแก้ไขข้อความ**

- เปลี่ยนจาก Web Part ที่กำหนดข้อความและ URL ของลิงก์เดียว มาเป็นตัวแก้ไขข้อความบนหน้า SharePoint คล้าย Text Web Part
- เพิ่มแถบเครื่องมือจัดรูปแบบข้อความ รวมถึงการตั้งค่าลิงก์ภายในเนื้อหา
- เพิ่มตัวเลือก **เปิดด้วย Chrome** ในหน้าต่างใส่ลิงก์ เพื่อเลือกเปิด Chrome เฉพาะลิงก์ที่ต้องการ
- เมื่อเลือกเปิดด้วย Chrome ระบบจะเติม `nasarut-inchrome-chrome:` ให้กับ URL แบบ `http://` หรือ `https://` อัตโนมัติ
- เพิ่มการตรวจสอบ URL และกรอง HTML ด้วย DOMPurify ก่อนบันทึกหรือแสดงผล
- จัดโครงสร้างโครงการเป็น `nasarut-inchrome/` และใช้ GitHub Actions (Node.js 22 / SPFx 1.22.2) เพื่อ Build ไฟล์ `.sppkg`
- กำหนดชื่อแพ็กเกจและ Web Part ให้เป็น **Nasarut-inchrome**

**หมายเหตุสำคัญ:** รุ่น 1.1.0.0 ใช้ Web Part ID ใหม่ต่างจากรุ่น 1.0.2.0 แม้จะใช้ Solution ID เดียวกัน จึงควรตรวจสอบหน้า SharePoint เดิมเมื่ออัปเกรด และอาจต้องเพิ่ม Web Part รุ่นใหม่ลงหน้าเพจอีกครั้ง

**Commit:** [Unify project as Nasarut-inchrome 1.1.0.0](https://github.com/Anantayot/OpenInChrome-SPFx/commit/162c0a1b475c9a213343f5493e9698ee3a317182)

## 1.0.2.0 — 20 ตุลาคม 2026

**เปลี่ยนชื่อแอปให้เป็น Nasarut-inchrome**

- เปลี่ยนชื่อ Solution และชื่อ Web Part ที่แสดงใน SharePoint เป็น **Nasarut-inchrome**
- ปรับชื่อไฟล์แพ็กเกจและชื่อ Artifact ในขั้นตอน GitHub Actions ให้สอดคล้องกัน
- เปลี่ยนข้อความอธิบายในหน้าตั้งค่าจาก `Open in Chrome` เป็น `Nasarut-inchrome`
- เพิ่มเวอร์ชันเป็น `1.0.2.0` โดยยังคงแนวทาง Web Part สำหรับลิงก์เดียว

**Commit:** [Rename SPFx application to Nasarut-inchrome and bump version to 1.0.2.0](https://github.com/Anantayot/OpenInChrome-SPFx/commit/3f88a809116e01a911c7e68572e939c2035860dc)

## 1.0.1.0 — 20 ตุลาคม 2026

**แก้ไขการคลิกลิงก์ผ่าน SharePoint**

- เพิ่ม `data-interception="off"` ให้ลิงก์ เพื่อไม่ให้ระบบนำทางของ SharePoint ดักการคลิกที่ควรส่งต่อไปยัง Windows custom protocol
- ปรับขั้นตอน Build ให้คง Solution ID, Feature ID และ Web Part ID เพื่อหลีกเลี่ยงการสร้างตัวตนใหม่ทุกครั้งที่ Build
- เพิ่มเวอร์ชัน Solution เป็น `1.0.1.0`

**Commit:** [Disable SharePoint link interception and preserve IDs for v1.0.1.0 upgrade](https://github.com/Anantayot/OpenInChrome-SPFx/commit/fedebe5ba54f80df26085434bdc21c424541af99)

## 1.0.0.0 — 20 ตุลาคม 2026 (รุ่นเริ่มต้น)

**เริ่มสร้าง Web Part สำหรับเปิดลิงก์ใน Chrome**

- พัฒนา SPFx Web Part สำหรับ SharePoint Online เพื่อแสดงลิงก์ที่ผู้ใช้คลิกได้
- เพิ่มช่องตั้งค่า **Text to display** และ **Address** เพื่อกำหนดชื่อและ URL ของลิงก์โดยไม่ต้องแก้โค้ด
- รองรับลิงก์ที่ใช้โปรโตคอล `nasarut-inchrome-chrome:` นำหน้า `http://` หรือ `https://`
- เริ่มใช้ GitHub Actions และ Node.js 22 ในการสร้างแพ็กเกจสำหรับติดตั้งบน SharePoint

**Commit:** [Add configurable custom-protocol hyperlink SPFx source](https://github.com/Anantayot/OpenInChrome-SPFx/commit/585723a9efc72b3930bbd7967d7a218553d92c66)

---

## หมายเหตุสำหรับการใช้งานและอัปเกรด

- ไฟล์เวอร์ชันล่าสุดอยู่ที่ [`dist/Nasarut-inchrome.sppkg`](dist/Nasarut-inchrome.sppkg)
- เครื่องผู้ใช้งานต้องมีการลงทะเบียน Windows custom protocol `nasarut-inchrome-chrome:` โดยฝ่าย IT ก่อน จึงจะเรียกเปิด Chrome ได้
- บันทึกนี้อ้างอิงการเปลี่ยนแปลงใน Source Code และผล Build เท่านั้น การใช้งานจริงยังต้องทดสอบบนหน้า SharePoint ขององค์กร
