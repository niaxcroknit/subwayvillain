from PIL import Image, ImageDraw, ImageFilter
import sys
F=256
src=Image.open(sys.argv[1]).convert('RGBA');out=Image.new('RGBA',src.size,(0,0,0,0))
cols=[int(c) for c in sys.argv[3].split(',')]
rows=[int(c) for c in sys.argv[5].split(',')] if len(sys.argv)>5 else [0,1,2,3]
for r in range(4):
  for c in range(4):
    cell=src.crop((c*F,r*F,c*F+F,r*F+F))
    if c not in cols or r not in rows or not cell.getbbox(): out.paste(cell,(c*F,r*F));continue
    x0,y0,x1,y1=cell.getbbox();fig=cell.crop((x0,y0,x1,y1));H=y1-y0;W=x1-x0
    foot=int(H*.11);k=(H-foot)/H;nw,nh=max(1,int(W*k)),int(H*k)
    fig=fig.resize((nw,nh),Image.LANCZOS)
    cv=Image.new('RGBA',(F,F),(0,0,0,0));ox=int((x0+x1)/2-nw/2);cv.paste(fig,(ox,y0),fig)
    px=cv.load();by=y0+nh-1
    # leg runs on the last solid row
    row=[px[x,by][3]>120 for x in range(F)];runs=[];x=0
    while x<F:
      if row[x]:
        s=x
        while x<F and row[x]:x+=1
        runs.append((s,x-1))
      else:x+=1
    runs=[r_ for r_ in runs if r_[1]-r_[0]>=4]
    if len(runs)==1 and runs[0][1]-runs[0][0]>nw*.3:
      a,b=runs[0];m=(a+b)//2;runs=[(a,m-2),(m+2,b)]
    d=ImageDraw.Draw(cv)
    # extend pants
    ext=int(foot*.35)
    for (a,b) in runs:
      for yy in range(by+1,by+1+ext):
        t=(yy-by)/ext
        for xx in range(a+int(t*1.5),b+1-int(t*1.5)):
          p=px[xx,by];px[xx,yy]=(int(p[0]*.92),int(p[1]*.92),int(p[2]*.92),255)
    # shoes
    white=sys.argv[4]=='white'
    for (a,b) in runs:
      w=(b-a)*1.08+4;cx=(a+b)/2;top=by+ext-4;h=foot-ext+3
      base=(238,235,228,255) if white else (52,44,40,255);sole=(210,206,198,255) if white else (230,226,218,255)
      d.rounded_rectangle([cx-w/2,top,cx+w/2,top+h],radius=int(min(w,h)/2.2),fill=base)
      d.rounded_rectangle([cx-w/2,top+h-3,cx+w/2,top+h],radius=2,fill=sole)
      hl=(255,255,255,150) if white else (110,98,92,200)
      d.ellipse([cx-w/3,top+2,cx+w/8,top+h*.4],fill=hl)
    out.paste(cv,(c*F,r*F))
out.save(sys.argv[2],optimize=True)
