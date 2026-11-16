# 원본 PNG(assets/atlas/*.png)를 게임에 내장할 WebP(assets/atlas-webp/*.webp)로 변환.
# 화질 88, 투명도는 무손실. 용량 약 1/3. 그림을 바꾸면 이걸 다시 실행한 뒤 빌드하세요.
# 사용: python3 scripts/make-webp.py
import os
from PIL import Image
os.makedirs('assets/atlas-webp',exist_ok=True)
for f in sorted(os.listdir('assets/atlas')):
    if not f.endswith('.png'):continue
    im=Image.open('assets/atlas/'+f).convert('RGBA')
    im.save('assets/atlas-webp/'+f[:-4]+'.webp','WEBP',quality=88,alpha_quality=100,method=6)
    print(f)
