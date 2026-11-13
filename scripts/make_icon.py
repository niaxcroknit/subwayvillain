import sys,math
from PIL import Image,ImageDraw,ImageFilter,ImageFont,ImageChops
atlas,out=sys.argv[1],sys.argv[2]
S=1024
# 배경: 2호선 초록 방사형
bg=Image.new('RGBA',(S,S))
d=ImageDraw.Draw(bg)
for r in range(S,0,-4):
    k=r/S;c=(int(20+48*(1-k)),int(110+90*(1-k)),int(52+40*(1-k)),255)
    d.ellipse((S*.62-r,S*.42-r,S*.62+r,S*.42+r),fill=c)
# 속도선
lines=Image.new('RGBA',(S,S),(0,0,0,0));ld=ImageDraw.Draw(lines)
import random;random.seed(7)
for i in range(16):
    y=random.randint(80,940);w=random.randint(6,18);x0=random.randint(520,760)
    ld.polygon([(x0,y),(S+40,y-70),(S+40,y-70+w*2),(x0,y+w*.3)],fill=(255,255,255,random.randint(40,90)))
bg.alpha_composite(lines)
# 주인공 (펀치 프레임) + 흰 테두리 + 그림자
im=Image.open(atlas).convert('RGBA')
cell=im.crop((256+8,768+4,256+248,768+230))
sc=3.55;hero=cell.resize((int(cell.width*sc),int(cell.height*sc)),Image.LANCZOS)
a=hero.split()[3]
outline=a.filter(ImageFilter.MaxFilter(25))
stroke=Image.new('RGBA',hero.size,(255,255,255,0));stroke.putalpha(outline)
shadow=Image.new('RGBA',hero.size,(8,40,22,0));shadow.putalpha(outline.filter(ImageFilter.GaussianBlur(18)).point(lambda v:int(v*.55)))
hx,hy=40,150
# 충격 별 (주먹 위치)
fx,fy=hx+int((436-256-8)*sc),hy+int((86-4)*sc)
burst=Image.new('RGBA',(S,S),(0,0,0,0));bd=ImageDraw.Draw(burst)
def star(cx,cy,R,r,n,rot,fill):
    pts=[]
    for i in range(n*2):
        rr=R if i%2==0 else r;ang=rot+i*math.pi/n
        pts.append((cx+rr*math.cos(ang),cy+rr*math.sin(ang)))
    bd.polygon(pts,fill=fill)
star(fx+20,fy,250,120,11,.2,(255,206,60,255))
star(fx+20,fy,175,80,11,.5,(255,244,170,255))
star(fx+20,fy,85,40,9,.1,(255,255,255,255))
bg.alpha_composite(burst)
bg.alpha_composite(shadow,(hx+10,hy+22));bg.alpha_composite(stroke,(hx,hy));bg.alpha_composite(hero,(hx,hy))
# 2호선 배지
bd2=ImageDraw.Draw(bg);cx,cy,R=196,196,128
bd2.ellipse((cx-R-14,cy-R-14,cx+R+14,cy+R+14),fill=(255,255,255,255))
bd2.ellipse((cx-R,cy-R,cx+R,cy+R),fill=(0,168,77,255))
f=ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf',210)
bd2.text((cx,cy+8),'2',font=f,fill=(255,255,255,255),anchor='mm')
# 아래쪽 살짝 어둡게
grad=Image.new('L',(1,S));[grad.putpixel((0,y),int(max(0,(y-S*.6)/(S*.4))*90)) for y in range(S)]
dark=Image.new('RGBA',(S,S),(5,30,15,255));dark.putalpha(grad.resize((S,S)));bg.alpha_composite(dark)
full=bg.convert('RGB');full.save(out+'/icon-1024.png')
# 둥근 모서리 버전(파비콘·일반 아이콘)
mask=Image.new('L',(S,S),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,S-1,S-1),radius=int(S*.22),fill=255)
rnd=bg.copy();rnd.putalpha(mask)
for n in [512,192]:full.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}-maskable.png');rnd.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}.png')
full.resize((180,180),Image.LANCZOS).save(out+'/apple-touch-icon.png')
rnd.resize((64,64),Image.LANCZOS).save(out+'/favicon-64.png');rnd.resize((32,32),Image.LANCZOS).save(out+'/favicon-32.png')
# Android 원형 자르기용(maskable): 내용을 가운데 80% 안에
for n in [512,192]:
    base=Image.new('RGB',(n,n),(24,128,60));inner=full.resize((int(n*.8),int(n*.8)),Image.LANCZOS);base.paste(inner,(int(n*.1),int(n*.1)));base.save(out+f'/icon-{n}-maskable.png')
