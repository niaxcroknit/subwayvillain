# 역무원 임시 스프라이트: incidents.png(발 보정본) 2열 2·3행의 빈손 남성을 재색 + 모자 + 반사띠
# 실행: assets/atlas 폴더에서 python3 ../../scripts/claude-art/make_guard.py
from PIL import Image, ImageDraw
import colorsys
F=256
inc=Image.open('incidents.png').convert('RGBA')
g=Image.new('RGBA',inc.size,(0,0,0,0))
for r in (2,3):
  fr=inc.crop((2*F,r*F,3*F,r*F+F));px=fr.load()
  for y in range(F):
    for x in range(F):
      R,G,B,a=px[x,y]
      if a<10:continue
      h,l,s=colorsys.rgb_to_hls(R/255,G/255,B/255);n=None
      if .66<h<.95 and s>.08 and l<.6: n=(.6,min(.62,l*1.25+.06),.55)
      elif s<.12 and .12<l<.5 and y>120: n=(.62,l*.8,.3)
      if n: rr,gg,bb=colorsys.hls_to_rgb(*n);px[x,y]=(int(rr*255),int(gg*255),int(bb*255),a)
  ys=[y for y in range(F) for x in range(0,F,2) if px[x,y][3]>100];top=min(ys)
  row=[x for x in range(F) if px[x,top+9][3]>100];x0,x1=min(row),max(row)
  d=ImageDraw.Draw(fr);cap=(28,44,82,255)
  d.chord([x0-5,top-4,x1+5,top+30],180,360,fill=cap);d.rectangle([x0-5,top+11,x1+5,top+15],fill=cap)
  if r==2: d.ellipse([x0+2,top+12,x1+9,top+20],fill=(18,30,60,255))
  cx=(x0+x1)/2;d.rectangle([cx-4,top+2,cx+4,top+8],fill=(230,200,70,255))
  for y in range(98,102):
    for x in range(F):
      R,G,B,a=px[x,y]
      if a>100:
        h,l,s=colorsys.rgb_to_hls(R/255,G/255,B/255)
        if .5<h<.7 and s>.3: px[x,y]=(214,226,80,a)
  g.paste(fr,(0,r*F))
g.save('guard.png',optimize=True)
