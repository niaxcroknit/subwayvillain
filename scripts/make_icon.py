# 2호선 격돌 앱 아이콘: 2호선 출입문이 가운데로 열리며 틈으로 승강장 빛이 들어오는 장면.
# 사용: python3 scripts/make_icon.py game/icons
import sys,math
from PIL import Image,ImageDraw,ImageFilter
out=sys.argv[1];S=2048  # 2배로 그린 뒤 줄여서 매끈하게
def vgrad(w,h,top,bot):
    g=Image.new('RGBA',(1,h))
    for y in range(h):
        k=y/max(1,h-1);g.putpixel((0,y),tuple(int(top[i]+(bot[i]-top[i])*k) for i in range(4)))
    return g.resize((w,h))
def hgrad(w,h,l,r):
    g=Image.new('RGBA',(w,1))
    for x in range(w):
        k=x/max(1,w-1);g.putpixel((x,0),tuple(int(l[i]+(r[i]-l[i])*k) for i in range(4)))
    return g.resize((w,h))
def rmask(w,h,r):
    m=Image.new('L',(w,h),0);ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),radius=r,fill=255);return m
img=vgrad(S,S,(236,239,241,255),(205,211,216,255))
d=ImageDraw.Draw(img)
# 벽의 2호선 초록 띠
d.rectangle((0,int(S*.60),S,int(S*.66)),fill=(0,160,74,255))
# 바닥과 노란 안전선
img.alpha_composite(vgrad(S,int(S*.16),(150,158,166,255),(118,126,134,255)),(0,int(S*.84)))
d.rectangle((0,int(S*.84),S,int(S*.855)),fill=(70,76,82,255))
d.rectangle((int(S*.16),int(S*.875),int(S*.84),int(S*.905)),fill=(255,206,40,255))
# 문틀(어두운 홈)
fx0,fy0,fx1,fy1=int(S*.16),int(S*.10),int(S*.84),int(S*.855)
frame=Image.new('RGBA',(S,S),(0,0,0,0));ImageDraw.Draw(frame).rounded_rectangle((fx0-26,fy0-26,fx1+26,fy1),radius=70,fill=(60,66,72,255))
img.alpha_composite(frame.filter(ImageFilter.GaussianBlur(3)))
# 문 사이로 보이는 승강장 빛
gap=int(S*.15);cx=S//2
light=Image.new('RGBA',(S,S),(0,0,0,0));lg=vgrad(fx1-fx0,fy1-fy0,(255,240,200,255),(255,214,130,255));light.paste(lg,(fx0,fy0))
img.alpha_composite(light)
core=Image.new('L',(S,S),0);ImageDraw.Draw(core).rectangle((cx-gap//5,fy0,cx+gap//5,fy1),fill=255)
img=Image.composite(Image.new('RGBA',(S,S),(255,253,244,255)),img,core.filter(ImageFilter.GaussianBlur(70)))
# 빛 번짐(틈 밖으로)
glow=Image.new('L',(S,S),0);gd=ImageDraw.Draw(glow);gd.rectangle((cx-gap//2,fy0,cx+gap//2,fy1),fill=255)
glow=glow.filter(ImageFilter.GaussianBlur(120)).point(lambda p:int(p*.85))
img=Image.composite(Image.new('RGBA',(S,S),(255,238,180,255)),img,glow)
# 바닥으로 쏟아지는 빛
fl=Image.new('L',(S,S),0);ImageDraw.Draw(fl).polygon([(cx-gap//2,fy1),(cx+gap//2,fy1),(cx+gap*1.9,S),(cx-gap*1.9,S)],fill=150)
img=Image.composite(Image.new('RGBA',(S,S),(255,236,170,255)),img,fl.filter(ImageFilter.GaussianBlur(40)))
# 문짝
dw=(fx1-fx0-gap)//2;dh=fy1-fy0
def door(left):
    w,h=dw,dh
    p=hgrad(w,h,(214,220,225,255),(178,187,195,255)) if left else hgrad(w,h,(178,187,195,255),(214,220,225,255))
    p.alpha_composite(vgrad(w,h,(255,255,255,40),(0,0,0,30)))
    pd=ImageDraw.Draw(p)
    # 창문
    wx0,wy0,wx1,wy1=int(w*.18),int(h*.08),int(w*.82),int(h*.50)
    pd.rounded_rectangle((wx0-10,wy0-10,wx1+10,wy1+10),radius=60,fill=(70,78,86,255))
    glass=vgrad(wx1-wx0,wy1-wy0,(52,74,96,255),(28,40,56,255));gm=rmask(wx1-wx0,wy1-wy0,52)
    gl=Image.new('RGBA',glass.size,(0,0,0,0));ImageDraw.Draw(gl).polygon([(int(glass.width*.15),glass.height),(int(glass.width*.55),0),(int(glass.width*.75),0),(int(glass.width*.35),glass.height)],fill=(255,255,255,46))
    glass.alpha_composite(gl);p.paste(glass,(wx0,wy0),gm)
    # 2호선 띠와 동그라미 표시
    by=int(h*.66)
    pd.rectangle((0,by,w,by+int(h*.035)),fill=(0,160,74,255))
    # 고무 패킹(가운데 쪽)
    ex=w-26 if left else 0
    pd.rectangle((ex,0,ex+26,h),fill=(32,34,38,255))
    return p
L=door(True);R=door(False)
sh=Image.new('RGBA',(S,S),(0,0,0,0));sd=ImageDraw.Draw(sh)
sd.rectangle((fx0,fy0,fx0+dw+14,fy1),fill=(0,0,0,90));sd.rectangle((fx1-dw-14,fy0,fx1,fy1),fill=(0,0,0,90))
img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
img.alpha_composite(L,(fx0,fy0));img.alpha_composite(R,(fx1-dw,fy0))
# 2호선 배지(왼쪽 문)
bx,by,br=fx0+int(dw*.5),fy0+int(dh*.60),int(S*.052)
d=ImageDraw.Draw(img);d.ellipse((bx-br,by-br,bx+br,by+br),fill=(0,160,74,255),outline=(255,255,255,255),width=10)
try:
    from PIL import ImageFont;f=ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf',int(br*1.45));d.text((bx,by+6),'2',font=f,fill=(255,255,255,255),anchor='mm')
except Exception:pass
full=img.resize((1024,1024),Image.LANCZOS).convert('RGB')
full.save(out+'/icon-1024.png')
mask=Image.new('L',(1024,1024),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,1023,1023),radius=225,fill=255)
rnd=full.convert('RGBA');rnd.putalpha(mask)
for n in[512,192]:rnd.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}.png')
full.resize((180,180),Image.LANCZOS).save(out+'/apple-touch-icon.png')
rnd.resize((64,64),Image.LANCZOS).save(out+'/favicon-64.png');rnd.resize((32,32),Image.LANCZOS).save(out+'/favicon-32.png')
# Android 원형 자르기용(maskable): 가운데 80% 안에 문 전체가 들어오게
for n in[512,192]:
    base=Image.new('RGB',(n,n),(214,219,223));inner=full.resize((int(n*.84),int(n*.84)),Image.LANCZOS);base.paste(inner,(int(n*.08),int(n*.08)));base.save(out+f'/icon-{n}-maskable.png')
