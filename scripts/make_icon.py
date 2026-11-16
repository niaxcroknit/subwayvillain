# 2호선 격돌 앱 아이콘: 승인 원화(references/approved/character-selection.png)의 남자 주인공 상반신.
# 글자·별·테두리 없이, 아래에서 은은한 2호선 초록빛과 가장자리 비네트만 더함.
# 사용: python3 scripts/make_icon.py game/icons
import sys
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
out=sys.argv[1]
src=Image.open('references/approved/character-selection.png').convert('RGB')
S=1024
img=src.crop((434,6,640,212)).resize((S,S),Image.LANCZOS)
img=img.filter(ImageFilter.UnsharpMask(radius=3,percent=60,threshold=2))
img=ImageEnhance.Contrast(img).enhance(1.06);img=ImageEnhance.Color(img).enhance(1.08)
# 아래쪽 2호선 초록빛
g=Image.new('L',(1,S));[g.putpixel((0,y),int(max(0,(y-S*.7)/(S*.3))**1.8*85)) for y in range(S)]
green=Image.new('RGB',(S,S),(0,150,72));img=Image.composite(green,img,g.resize((S,S)))
# 가장자리 비네트
v=Image.new('L',(S,S),0);ImageDraw.Draw(v).ellipse((-S*.25,-S*.2,S*1.25,S*1.3),fill=255);v=v.filter(ImageFilter.GaussianBlur(S*.12))
dark=Image.new('RGB',(S,S),(18,34,28));img=Image.composite(img,dark,v.point(lambda p:int(150+p*105/255)))
img.save(out+'/icon-1024.png')
mask=Image.new('L',(S,S),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,S-1,S-1),radius=int(S*.22),fill=255)
rnd=img.convert('RGBA');rnd.putalpha(mask)
for n in [512,192]:rnd.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}.png')
img.resize((180,180),Image.LANCZOS).save(out+'/apple-touch-icon.png')
rnd.resize((64,64),Image.LANCZOS).save(out+'/favicon-64.png');rnd.resize((32,32),Image.LANCZOS).save(out+'/favicon-32.png')
# Android 원형 자르기용(maskable): 얼굴이 가운데 안전 영역에 들어오도록 그대로(원화가 가장자리까지 배경이라 잘려도 자연스러움)
for n in [512,192]:img.resize((n,n),Image.LANCZOS).save(out+f'/icon-{n}-maskable.png')
