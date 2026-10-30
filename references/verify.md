# Verify: ตรวจเหมือนนักวิจารณ์

ต้องเปิดดูทุก PNG ที่ถ่าย ถ้าไม่ได้ดู ห้ามบอกว่าผ่าน

## 1. Static
```bash
node scripts/check.mjs examples/NAME/NAME.html        # ต้องจบด้วย "check passed"
```

## 2. ภาพนิ่งทั้งสองธีมและสองความกว้าง
```bash
node scripts/shoot.mjs examples/NAME/NAME-dark.html  --wait 50 --hash t=0.2
node scripts/shoot.mjs examples/NAME/NAME-light.html --wait 50 --hash t=0.2
node scripts/shoot.mjs examples/NAME/NAME-dark.html  --width 390 --height 760 --wait 50 --hash t=0.2
```
`--hash t=N` จะกรอการจำลองไป N วินาทีด้วยสเต็ป 1/60 ทำให้ภาพที่ได้ deterministic ส่วน `--wait` ให้ใช้ค่าน้อยเพื่อไม่ให้เวลาจริงไหลต่อ ที่ความกว้างต่ำกว่า 500 px สคริปต์จะใส่ iframe ให้เอง เพราะ headless Chrome เปิดหน้าต่างแคบกว่า 500 ไม่ได้

## 3. Contact sheet ของการเคลื่อนไหว
```bash
S=examples/NAME/shots
for t in 0.4 1.25 4 6; do node scripts/shoot.mjs examples/NAME/NAME-dark.html --wait 50 --hash t=$t --out $S/h$t.png; done
ffmpeg -loglevel error -y -i $S/h0.4.png -i $S/h1.25.png -i $S/h4.png -i $S/h6.png \
  -filter_complex "[0]scale=600:-1[a];[1]scale=600:-1[b];[2]scale=600:-1[c];[3]scale=600:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" $S/sheet.png
```
สิ่งที่ต้องดูใน sheet: ชิ้นที่ขยับต้องไม่ทะลุชิ้นอื่น ลำดับการบังต้องถูกทุกเฟรม ต้องไม่มีชิ้นค้าง และต้องไม่มีชิ้นไปกองที่จุด origin

## 4. ภาพขยาย 4×
```bash
node scripts/shoot.mjs examples/NAME/NAME-dark.html --wait 50 --hash t=1 --zoom 4 --at 340,450
```
`--at` คือพิกัด CSS px ของหน้าเว็บที่ความกว้าง 760 ให้ถ่ายทุกรอยต่อ ได้แก่ ฐานเสา วงแหวนรัด ขอบที่ texture สิ้นสุด จุดที่ชิ้นขยับเลื่อนผ่าน และหน้าที่มีตะเข็บ ทั้งในธีม dark และ light

## 5. พิสูจน์ความจริงจาก DOM
อ่าน readout ที่หลายช่วงเวลาเพื่อยืนยันว่ากรณีสำคัญเกิดจริง:
```bash
F=$(pwd)/examples/NAME/NAME-dark.html
for t in 1 2 3 4 5 6 8; do printf "t=%-4s " $t
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=10 \
    --dump-dom "file://$F#t=$t" 2>/dev/null | grep -o 'data-readout[^>]*>[^<]*' | sed 's/.*>//'; done
```

## Checklist สุดท้าย
- [ ] เห็นปุ๊บรู้ทันทีว่าเป็นของจริง และไม่มีกล่องติดป้าย
- [ ] มี 40 ชิ้นขึ้นไป และซูม 4× แล้วไม่มีหน้าโล่ง
- [ ] ทุกเส้นจบบนขอบ เส้นอื่น หรือจุด
- [ ] มี lit แค่หนึ่งชนิด
- [ ] painter's order ถูกในทุกเฟรมของ sheet
- [ ] ภาพอ่านรู้เรื่องโดยไม่มี JS เพราะตำแหน่งพักอยู่ใน markup
- [ ] readout, motion และ caption มาจากโมเดลเดียวกัน และทัวร์ไปถึงกรณีขอบ
- [ ] reduced motion นิ่ง, หยุดเมื่ออยู่นอกจอ, ใช้คีย์บอร์ดได้
- [ ] ที่ 390 px ยังอ่านรู้เรื่อง และใช้ได้ทั้งสองธีม
