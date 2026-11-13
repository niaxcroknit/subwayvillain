# 2호선 격돌 앱 아이콘(단순 버전): 2호선 초록 바탕 + 흰 원 '2' + 장우산 + 노란 충격
# 사용: python3 scripts/make_icon.py game/icons
import sys,math
from PIL import Image,ImageDraw,ImageFont
out=sys.argv[1];S=2048  # 2배로 그린 뒤 줄여서 매끈하게
img=Image.new('RGBA',(S,S),(0,168,77,255));d=ImageDraw.Draw(img)
# 우산(대각선, 원 뒤)
ax,ay,bx,by=470,1690,1580,470
L=math.hypot(bx-ax,by-ay);ux,uy=(bx-ax)/L,(by-ay)/L;nx,ny=-uy,ux
P=lambda t,o:(ax+ux*t+nx*o,ay+uy*t+ny*o)
NAVY=(28,52,92,255);NAVY2=(56,96,150,255)
d.line([P(0,0),P(L*.98,0)],fill=NAVY,width=56)
d.polygon([P(L*.28,0),P(L*.40,150),P(L*.92,46),P(L*1.0,0),P(L*.92,-46),P(L*.40,-150)],fill=NAVY)
d.polygon([P(L*.40,150),P(L*.92,46),P(L*.90,14),P(L*.43,64)],fill=NAVY2)
hx,hy=P(0,0);r=95;d.arc((hx-2*r,hy-r,hx,hy+r),start=0,end=180,fill=NAVY,width=56)
# 노란 충격(우산 끝)
def star(cx,cy,R,r,n,rot,fill):
    d.polygon([(cx+(R if i%2==0 else r)*math.cos(rot+i*math.pi/n),cy+(R if i%2==0 else r)*math.sin(rot+i*math.pi/n)) for i in range(2*n)],fill=fill)
tx,ty=P(L*1.0,0);star(tx,ty,270,130,10,.3,(255,206,60,255));star(tx,ty,140,70,10,.6,(255,246,190,255))
# 흰 원 + 초록 '2'
cx,cy,R=880,1110,470
d.ellipse((cx-R-30,cy-R-30,cx+R+30,cy+R+30),fill=(0,140,64,255))
d.ellipse((cx-R,cy-R,cx+R,cy+R),fill=(255,255,255,255))
f=ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf',680)
d.text((cx,cy+40),'2',font=f,fill=(0,168,77,255),anchor='mm')
full=img.resize((1024,1024),Image.LANCZOS)
full.convert('RGB').save(out+'/icon-1024.png')
mask=Image.new('L',(1024,1024),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,1023,1023),radius=225,fill=255)
rnd=full.copy();rnd.putalpha(mask)
for n in [512,192]:rnd.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}.png')
full.convert('RGB').resize((180,180),Image.LANCZOS).save(out+'/apple-touch-icon.png')
rnd.resize((64,64),Image.LANCZOS).save(out+'/favicon-64.png');rnd.resize((32,32),Image.LANCZOS).save(out+'/favicon-32.png')
# Android 원형 자르기용(maskable): 내용을 가운데 80% 안에
for n in [512,192]:
    base=Image.new('RGB',(n,n),(0,168,77));inner=full.convert('RGB').resize((int(n*.8),int(n*.8)),Image.LANCZOS);base.paste(inner,(int(n*.1),int(n*.1)));base.save(out+f'/icon-{n}-maskable.png')
