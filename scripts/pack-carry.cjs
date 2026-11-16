const path=require('path'),root=path.resolve(__dirname,'..'),fs=require('fs'),{loadImage,createCanvas}=require('@napi-rs/canvas');
(async()=>{for(const sex of['male','female']){
 const im=await loadImage(path.join(root,'assets/original/carry-'+sex+'.png')),src=createCanvas(im.width,im.height),sc=src.getContext('2d');sc.drawImage(im,0,0);const cells=[];
 for(let row=0;row<4;row++)for(let col=0;col<8;col++){
  const x0=Math.floor(col*im.width/8),y0=Math.floor(row*im.height/4),w=Math.floor((col+1)*im.width/8)-x0,h=Math.floor((row+1)*im.height/4)-y0,p=sc.getImageData(x0,y0,w,h),seen=new Uint8Array(w*h);let best=[];
  for(let j=0;j<w*h;j++)if(!seen[j]&&p.data[j*4+3]>100){const group=[],todo=[j];seen[j]=1;while(todo.length){const n=todo.pop();group.push(n);const x=n%w,y=Math.floor(n/w);for(const k of[x>0?n-1:-1,x<w-1?n+1:-1,y>0?n-w:-1,y<h-1?n+w:-1])if(k>=0&&!seen[k]&&p.data[k*4+3]>100){seen[k]=1;todo.push(k);}}if(group.length>best.length)best=group;}
  let minX=w,maxX=0,minY=h,maxY=0;const mask=new Uint8Array(w*h);for(const n of best){const x=n%w,y=Math.floor(n/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h)mask[(y+dy)*w+x+dx]=1;}
  for(let n=0;n<w*h;n++)if(!mask[n])p.data[n*4+3]=0;
  let total=0,mass=0;for(const n of best){const y=Math.floor(n/w);if(y>=minY&&y<minY+(maxY-minY)*.24){mass+=n%w;total++;}}
  const center=total?mass/total:(minX+maxX)/2;const cv=createCanvas(w,h);cv.getContext('2d').putImageData(p,0,0);cells.push({cv,w,h,minX,maxX,minY,maxY,center});
 }
 // One scale for the entire cycle: per-frame auto-fit causes artificial breathing/squashing.
 const heights=cells.map(c=>c.maxY-c.minY+1).sort((a,b)=>a-b),reference=heights[Math.floor(heights.length/2)];let scale=228/reference;
 for(const c of cells)scale=Math.min(scale,232/(c.maxY-c.minY+1),185/Math.max(c.center-c.minX,c.maxX-c.center));
 const out=createCanvas(3072,1024),oc=out.getContext('2d');cells.forEach((c,i)=>{const row=Math.floor(i/8),col=i%8;oc.save();oc.beginPath();oc.rect(col*384,row*256,384,256);oc.clip();oc.drawImage(c.cv,col*384+192-c.center*scale,row*256+244-c.maxY*scale,c.w*scale,c.h*scale);oc.restore();});
 fs.writeFileSync(path.join(root,'assets/atlas/carry-'+sex+'.png'),out.toBuffer('image/png'));console.log(sex,'32 frames, shared scale',scale.toFixed(4));
}})().catch(e=>{console.error(e);process.exitCode=1});
