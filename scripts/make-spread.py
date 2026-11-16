from PIL import Image
import numpy as np,sys
im=Image.open(sys.argv[1]).convert('RGBA')
out=Image.new('RGBA',im.size,(0,0,0,0))
def spread(cell,cx,yh,ang):
  W,H=cell.size;A=np.array(cell)
  base=A.copy();base[yh+4:,:]=0
  L=A.copy();L[:yh,:]=0;L[:,cx:]=0
  R=A.copy();R[:yh,:]=0;R[:,:cx]=0
  res=Image.fromarray(base)
  def rot(X,a):
    # premultiplied rotate: no light fringe from transparent pixels at the cut edges
    P=X.astype(np.float32);P[...,:3]*=P[...,3:]/255
    ch=[np.array(Image.fromarray(P[...,i].astype(np.float32),'F').rotate(a,resample=Image.BILINEAR,center=(cx,yh))) for i in range(4)]
    Q=np.stack(ch,-1);al=np.maximum(Q[...,3:],1e-3);Q[...,:3]=np.where(Q[...,3:]>0.5,Q[...,:3]*255/al,0)
    return Image.fromarray(Q.clip(0,255).astype(np.uint8))
  Lr=rot(L,-ang);Rr=rot(R,ang)
  for I in (Lr,Rr):
    q=np.array(I);q[:yh+1,:]=0;I.paste(Image.fromarray(q))
  # fill crotch wedge using the original lower region's centre so no hole at the top
  wedge=A.copy();wedge[:yh,:]=0;wedge[yh+14:,:]=0
  res=Image.alpha_composite(res,Image.fromarray(wedge))
  res=Image.alpha_composite(res,Lr);res=Image.alpha_composite(res,Rr)
  return res
cfg={(0,0):(116,166,11)}
for (r,c),(cx,yh,ang) in cfg.items():
  cell=im.crop((c*256,r*256,c*256+256,r*256+256))
  out.paste(spread(cell,cx,yh,ang),(c*256,r*256))
# rear view: the visible leg is mirrored under the body so both knees show (wide stance from behind)
cell=im.crop((0,256,256,512));A=np.array(cell)
leg=A.copy();leg[:186,:]=0;leg[:,:132]=0
mir=leg[:,::-1].copy();sh=np.zeros_like(mir);sh[:,6:]=mir[:,:-6]
out.paste(Image.alpha_composite(Image.fromarray(sh),cell),(0,256))
out.save(sys.argv[2])
