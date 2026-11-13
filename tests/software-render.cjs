// Software geometry/art inspection helper. Not a browser/WebGL screenshot.
function renderCPU(scene,camera,dest,game=false){
 const W=1440,H=740,out=createCanvas(W,H),ctx=out.getContext('2d');const pixels=new Uint8ClampedArray(W*H*4),depth=new Float32Array(W*H).fill(Infinity);
 for(let i=0;i<W*H;i++){pixels[i*4]=urban?65:205;pixels[i*4+1]=urban?76:219;pixels[i*4+2]=urban?83:211;pixels[i*4+3]=255;}
 if(!game){camera.aspect=W/H;camera.updateProjectionMatrix();camera.position.set(0,urban?2.9:4.8,7.8);camera.lookAt(0,.9,0);}scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const light=new T.Vector3(-3,7,6).normalize(),normalM=new T.Matrix3(),wp=new T.Vector3(),nn=new T.Vector3();
 scene.traverse(m=>{
  let hidden=false;for(let p=m;p;p=p.parent)if(!p.visible)hidden=true;
  let unlit=false;
  if(m.isSprite&&!hidden){const pos=new T.Vector3(),scale=new T.Vector3(),quat=new T.Quaternion();m.matrixWorld.decompose(pos,quat,scale);camera.getWorldQuaternion(quat);const matrix=new T.Matrix4().compose(pos,quat,scale),plane=new T.PlaneGeometry(1,1);plane.translate(.5-m.center.x,.5-m.center.y,0);m={isMesh:true,visible:true,parent:null,geometry:plane,matrixWorld:matrix,material:m.material};unlit=true;}
  if(!m.isMesh||hidden||!m.geometry.attributes.normal)return;
  const mat=m.material;if(mat===undefined||mat.opacity===0)return;
  const geom=m.geometry,ps=geom.attributes.position,ns=geom.attributes.normal,uv=geom.attributes.uv,cs=geom.attributes.color,ix=geom.index;if(geom.type==='PlaneGeometry'&&geom.parameters.width>10)return;
  const verts=[];normalM.getNormalMatrix(m.matrixWorld);
  const tex=mat.map?.image;let img;
  if(tex?.getContext){try{img=tex.getContext('2d').getImageData(0,0,tex.width,tex.height);}catch{}}
  for(let i=0;i<ps.count;i++){wp.fromBufferAttribute(ps,i).applyMatrix4(m.matrixWorld).project(camera);nn.fromBufferAttribute(ns,i).applyMatrix3(normalM).normalize();const lum=unlit?1:.70+Math.max(0,nn.dot(light))*.48;verts.push({x:(wp.x*.5+.5)*W,y:(-.5*wp.y+.5)*H,z:wp.z,l:lum,u:uv?.getX(i)||0,v:uv?.getY(i)||0,shade:cs?.getX(i)||1});}
  const count=ix?ix.count:ps.count;
  for(let i=0;i<count;i+=3){const a=verts[ix?ix.getX(i):i],b=verts[ix?ix.getX(i+1):i+1],c=verts[ix?ix.getX(i+2):i+2];
   const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.01)continue;
   if(den>0&&mat.side!==T.DoubleSide)continue;
   const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(H-1,Math.ceil(Math.max(a.y,b.y,c.y)));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const p=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,q=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,r=1-p-q;if(p<0||q<0||r<0)continue;
    const z=p*a.z+q*b.z+r*c.z,idx=y*W+x;if(mat.depthTest!==false&&z>=depth[idx])continue;
    let rr=mat.color.r,gg=mat.color.g,bb=mat.color.b,alpha=mat.opacity;
    if(img){const rect=mat.userData?.atlasRect;let u=p*a.u+q*b.u+r*c.u,v=p*a.v+q*b.v+r*c.v;if(rect){u=u*rect.z+rect.x;v=v*rect.w+rect.y;}const tx=Math.max(0,Math.min(img.width-1,Math.floor(u*img.width))),ty=Math.max(0,Math.min(img.height-1,Math.floor((1-v)*img.height))),j=(ty*img.width+tx)*4;rr*=Math.pow(img.data[j]/255,2.2);gg*=Math.pow(img.data[j+1]/255,2.2);bb*=Math.pow(img.data[j+2]/255,2.2);alpha*=img.data[j+3]/255;}
    if(alpha<.02)continue;const lum=(p*a.l+q*b.l+r*c.l)*(p*a.shade+q*b.shade+r*c.shade);
    const j=idx*4;for(const [k,v]of[[0,rr],[1,gg],[2,bb]])pixels[j+k]=Math.min(255,Math.pow(v*lum,1/2.2)*255)*alpha+pixels[j+k]*(1-alpha);if(mat.depthWrite)depth[idx]=z;
   }
  }
 });
 const image=ctx.createImageData(W,H);image.data.set(pixels);ctx.putImageData(image,0,0);if(!game){ctx.fillStyle=urban?'#e0e4df':'#234237';ctx.font='bold 25px "Malgun Gothic"';ctx.fillText(urban?'2호선 격돌 · 어반 액션':'2호선 격돌 · 플레이 모델 개정',38,46);ctx.font='18px "Malgun Gothic"';ctx.textAlign='center';['김대리','민폐 승객','역무원','어르신'].forEach((t,i)=>ctx.fillText(t,720+(i-1.5)*294,650));}fs.writeFileSync(dest,out.toBuffer('image/png'));console.log('Model geometry render:',dest);
}
