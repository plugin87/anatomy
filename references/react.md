# React / Next.js

ใช้ Node build เป็นแหล่งความจริงเดียว แล้วให้ React แค่ "สวม" ผลลัพธ์

> หมายเหตุ: ตัวอย่าง token-bucket ยังเขียนออกแค่ HTML ส่วนขั้นที่ 1 ต้องเพิ่มเองเมื่อจะใช้กับโปรเจกต์ React

1. ให้ build เขียนไฟล์เพิ่ม 3 ไฟล์ข้างๆ HTML ได้แก่ `NAME.svg.txt` (SVG markup), `NAME.live.js` (live script ที่ห่อเป็น `export function mount(stage, readout) { ... }`) และ `iso.css` (export `CSS` จาก kit)
2. Server component เรนเดอร์การ์ด ตัวอย่างโครงสร้าง:
   ```tsx
   // app/components/TokenBucketFigure.tsx (server)
   import svg from "./token-bucket.svg.txt"; // หรือ fs.readFileSync ตอน build
   import { Live } from "./TokenBucketLive";
   export function TokenBucketFigure() {
     return (
       <figure className="ix-figure">
         <div className="ix-card">
           {/* corners */}
           <Live svg={svg} />
         </div>
       </figure>
     );
   }
   ```
3. Client component ตัวเดียว:
   ```tsx
   "use client";
   import { useEffect, useRef } from "react";
   import { mount } from "./token-bucket.live.js";
   export function Live({ svg }: { svg: string }) {
     const ref = useRef<HTMLDivElement>(null);
     useEffect(() => mount(ref.current!, ref.current!.closest(".ix-card")!.querySelector("[data-readout]")), []);
     return <div ref={ref} className="ix-stage" tabIndex={0} dangerouslySetInnerHTML={{ __html: svg }} />;
   }
   ```
4. ห้ามแปลงทุก path เป็น JSX element เพราะหน้าที่มี path นับพันจะทำให้ payload บวมและเกิด key warning ให้ใช้ SVG เป็น string ก้อนเดียว
5. `mount` ต้องคืน cleanup ที่ทำ `disconnect` IntersectionObserver และถอด listener ทั้งหมด
6. CSS: import `iso.css` ครั้งเดียวที่ layout ส่วน tokens อยู่บน `:root` อยู่แล้ว ถ้าเว็บมีระบบธีมของตัวเอง ให้ map `data-theme` เข้าหากัน
