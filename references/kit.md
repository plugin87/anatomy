# Kit API (`kit/iso.mjs`)

```js
import * as k from "../../kit/iso.mjs";
```

## กล้อง
| ฟังก์ชัน | หมายเหตุ |
|---|---|
| `fit(points3, W, H, { pad, azimuth=45, elevation=30 })` → `P` | ปรับ scale และจัดกึ่งกลางให้ทุกจุดพอดีกรอบ |
| `iso([x,y,z], P)` → `[sx, sy]` | แปลงจุดในโลกเป็นจุดบนจอ |
| `depthOf([x,y,z], P)` | ค่ามากกว่า = อยู่ใกล้ผู้ชมกว่า ต้องวาดทีหลัง |
| `byDepth(items, P, anchor)` | เรียง item จากหลังไปหน้า |
| `toViewer(P)` | ทิศบนพื้นที่ชี้ไปหาผู้ชม |

## ผัง
`roundedPlan(plan, steps)`, `circlePlan(cx, cy, r, steps)`, `insetPlan(plan, by)` (ใส่ค่าลบเพื่อขยาย), `corners(plan, inset)`, `boxPoints(plan, z0, z1)`

## Solids → `{ fill, edge, top, shades[4], crease }`
| ฟังก์ชัน | หมายเหตุ |
|---|---|
| `extrude(ring, z, h, P)` | ring ต้องเป็นรูปนูน (convex) แรเงา 4 โทนตามทิศที่หันหาแสง |
| `slab(plan, z, h, P, steps)` | กล่อง rounded rect |
| `cylinder(cx, cy, r, z, h, P, steps)` | ทรงกระบอกแนวตั้ง |

## เส้นและรายละเอียด (คืนค่าเป็น path `d`)
`onPlane(points2, z, P, closed)`, `planOutline(plan, z, P)`, `ring(cx, cy, r, z, P)`, `segment(a3, b3, P)`, `frontArc(cx, cy, r, z, P)` (วงครึ่งหน้าบนทรงกลม), `knurl(cx, cy, r, z0, z1, n, P)`, `ticks(from, to, step, every, edgeY, z, [minor, major], P)` → `{minor, major}`, `faceTicks(faceX, edgeY, levels, every, lens, P)`, `radialTicks(cx, cy, r, n, every, z, lens, P, from, span)`, `haloOf(plan, z, P)`, `clipAbove(cx, cy, r, z, P)` (path สำหรับ `<clipPath>` ให้แกนที่ลอดเข้าปลอกหายไปตรงปากปลอก), `topMatrix([x,y], z, P, "x"|"y")`

## Markup
| ฟังก์ชัน | หมายเหตุ |
|---|---|
| `solidSvg(paths, { tone, lit, crease, flat })` | `tone`: hi / mid / lo / faint, ส่วน `lit` ใช้ได้กับ subject เท่านั้น |
| `lineSvg(d, { tone, free, width })` | `free` สำหรับ rule line ที่แทนตัวหนังสือ |
| `dotsSvg(screenPoints, { r, tone })` | สกรู, หมุด |
| `wireSvg(screenPoints, { tone })` | สายที่ปลายทั้งสองข้างจบด้วยจุด terminal |
| `faceText(matrix, text, { size, tone })` | ป้ายสลักได้ไม่เกินหนึ่งจุด |
| `haloSvg(d, blur)` | เงานุ่ม |
| `figureSvg({ width, height, label, body })` | `label` คือคำบรรยายสำหรับ screen reader ต้องเขียนเป็นประโยคจริง |
| `cardHtml({ fig, title, hint, readout, keys, caption, body })` | `keys[].mark`: lit / mid / dim |
| `pageHtml({ title, body, script, theme: "auto"\|"dark"\|"light" })` | |

## Runtime (string สำหรับ inline ลงในหน้า)
`runtimeSource(P)` จะสร้างตัวแปรและฟังก์ชันในหน้าเว็บดังนี้:
- `iso(v)`, `along(v)` → `"translate(dx dy)"`, `onPlane(pts, z)` → path `d`
- `follow(from, to, dt, tau)`: exponential follow
- `stillQuery`: MediaQueryList ของ reduced motion
- `loop(stage, tick)` → `wake()`: วน rAF เฉพาะตอนที่อยู่บนจอ โดย `tick(dt, still)` ต้องคืน `false` เมื่อทุกอย่างนิ่งแล้ว ถ้ามี `#t=N` ใน URL จะกรอไปข้างหน้า N วินาทีก่อนเฟรมแรก

## หน้าตั้ง, สาย และ clip (เพิ่มตอนทำ bangkok-bts)
| ฟังก์ชัน | หมายเหตุ |
|---|---|
| `poly3(points3, P, closed)` | path ผ่านจุด 3 มิติ |
| `onFaceY(pts[x,z], y, P, closed)` / `onFaceX(pts[y,z], x, P, closed)` | เส้นบนหน้าตั้ง เช่น หน้าต่าง ตะเข็บ หรือแม่บันได |
| `rectOnFaceY(x0, x1, z0, z1, y, P, r)` / `ringOnFaceY(cx, cz, r, y, P)` | สี่เหลี่ยมหรือวงกลมบนหน้า +y เช่น ช่องเปิด ล้อ หรือพัดลมแอร์ ถ้าใส่ `class="ix-shade" data-s="0"` จะได้ช่องมืด |
| `sagLine(a3, b3, sag, P)` | สายไฟที่หย่อนกลางช่วงลงไป `sag` หน่วย |
| `boxHull(plan, z0, z1, P)` | เงาของกล่องบนจอ ใช้เป็น clipPath ให้ของที่วิ่ง (รถไฟ, รถ) หายตรงขอบฐานโมเดล |
