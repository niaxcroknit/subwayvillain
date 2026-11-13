from PIL import Image
import colorsys, math
F=256
def frame(im,r,c): return im.crop((c*F,r*F,c*F+F,r*F+F))
def bbox(fr):
    return fr.getbbox()
def warp(fr):
    x0,y0,x1,y1=bbox(fr); H=y1-y0
    # body center from the hips row (avoid the pointing arm)
    src=fr.load(); out=Image.new('RGBA',(F,F),(0,0,0,0)); dst=out.load()
    hy=int(y0+H*.55); xs=[x for x in range(F) if src[x,hy][3]>40]; cx=(min(xs)+max(xs))/2 if xs else F/2
    def f(t):
        if t<.17: return 1.0
        if t<.24: return 1+ .36*(t-.17)/.07
        if t<.40: return 1.36
        if t<.55: return 1.36-.24*(t-.40)/.15
        return 1.10
    for y in range(F):
        t=(y-y0)/H if H else 0; k=f(t) if y0<=y<=y1 else 1
        for x in range(F):
            sx=cx+(x-cx)/k
            if 0<=sx<F-1:
                a=int(sx); w=sx-a; p=src[a,y]; q=src[a+1,y]
                dst[x,y]=tuple(int(p[i]*(1-w)+q[i]*w) for i in range(4))
    return out
def recol(fr,rule):
    px=fr.load()
    for y in range(F):
        for x in range(F):
            r,g,b,a=px[x,y]
            if a<10: continue
            h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
            n=rule(h,l,s,y)
            if n: rr,gg,bb=colorsys.hls_to_rgb(*n); px[x,y]=(int(rr*255),int(gg*255),int(bb*255),a)
    return fr
inc=Image.open('incidents.png').convert('RGBA')
boss=Image.new('RGBA',inc.size,(0,0,0,0))
def shirt(h,l,s,y):
    if .66<h<.95 and s>.08 and l<.6: return (.0,l*.55,.15)   # purple shirt -> tight black tee
    return None
for r in range(4):
    fr=warp(frame(inc,r,2)); fr=recol(fr,shirt); boss.paste(fr,(2*F,r*F))
boss.save('boss.png',optimize=True)
pas=Image.open('passengers.png').convert('RGBA')
hs=Image.new('RGBA',pas.size,(0,0,0,0))
def male(h,l,s,y):
    yy=y%F
    if s<.14 and h>.78 and .2<l<.72 and 62<yy<215: return (.30,l*.75,.24)   # cool gray hoodie -> olive jacket
    if s<.14 and h<.14 and .28<l<.86: return (.6,l*.42,.05)   # warm gray pants -> charcoal
    return None
def female(h,l,s,y):
    if (h<.04 or h>.94) and s>.25 and l<.6: return (.30,l*1.05+.05,.22)  # red cardigan -> olive
    return None
for r in range(2):
    hs.paste(recol(frame(pas,r,0),male),(0,r*F)); hs.paste(recol(frame(pas,r,1),female),(F,r*F))
hs.save('herosit.png',optimize=True)
prev=Image.new('RGBA',(F*4,F*2),'white')
for i,(im,r,c) in enumerate([(boss,0,2),(boss,1,2),(inc,0,2),(hs,0,0),(hs,0,1),(hs,1,0),(hs,1,1)]):
    t=frame(im,r,c);prev.paste(t,((i%4)*F,(i//4)*F),t)
prev.save('/tmp/claude-0/-home-claude/c1dcf411-6a27-5852-be43-9e7c91b5faac/scratchpad/artprev.png')
