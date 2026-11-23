# 메트로펑크 앱 아이콘: 사용자가 지정한 원본(assets/icon/icon-source.png)에서 모든 크기를 만듦.
# 원본은 모서리 바깥이 단색(검정 또는 흰색)인 RGB라서, 네 모서리에서 그 색만 투명하게 따냄.
# 이전 아이콘(크림색 문)은 assets/icon/icon-source-v1-door.png
# 사용: python3 scripts/make_icon.py game/icons
import sys
from PIL import Image,ImageDraw,ImageFilter
out=sys.argv[1]
src=Image.open('assets/icon/icon-source.png').convert('RGB')
W,H=src.size
# 네 모서리에서 흰 바탕만 채우기 → 투명 마스크
m=Image.new('L',(W,H),0);m.paste(src.convert('L'))
bg=Image.new('L',(W,H),0)
work=src.copy()
for c in[(0,0),(W-1,0),(0,H-1),(W-1,H-1)]:ImageDraw.floodfill(work,c,(255,0,255),thresh=18)
px=work.load();a=Image.new('L',(W,H),255);ap=a.load()
for y in range(H):
    for x in range(W):
        if px[x,y]==(255,0,255):ap[x,y]=0
a=a.filter(ImageFilter.GaussianBlur(1.2))
icon=src.convert('RGBA');icon.putalpha(a)
S=1024;full=icon.resize((S,S),Image.LANCZOS)
GREEN=src.getpixel((W//40,H//2))+(255,)  # 바탕색 = 아이콘 테두리 색
solid=Image.new('RGBA',(S,S),GREEN);solid.alpha_composite(full)  # 모서리까지 꽉 찬 버전(iOS가 직접 둥글게 자름)
solid.convert('RGB').save(out+'/icon-1024.png')
for n in[512,192]:full.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}.png')
solid.convert('RGB').resize((180,180),Image.LANCZOS).save(out+'/apple-touch-icon.png')
full.resize((64,64),Image.LANCZOS).save(out+'/favicon-64.png');full.resize((32,32),Image.LANCZOS).save(out+'/favicon-32.png')
# Android 원형 자르기용(maskable): 가운데 80% 안에 전체가 들어오게
for n in[512,192]:
    base=Image.new('RGBA',(n,n),GREEN);inner=full.resize((int(n*.82),int(n*.82)),Image.LANCZOS);base.alpha_composite(inner,(int(n*.09),int(n*.09)));base.convert('RGB').save(out+f'/icon-{n}-maskable.png')
