const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const keys=["swing-bag-male","carry-bag-male","swing-bag-female","carry-bag-female","swing-ext-male","carry-ext-male","swing-ext-female","carry-ext-female","swing-bat-male","carry-bat-male","swing-bat-female","carry-bat-female","hook-male"];
(async()=>{
 const report={cell:{width:192,height:160,footY:152},rows:['front','right','back','left'],frames:[],sheets:[]};
 for(const key of keys){
  const im=await loadImage(path.join(root,'assets/original',key+'.png')),cv=createCanvas(im.width,im.height),ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
  const w=im.width,h=im.height,data=ctx.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),cells=new Array(32);
  for(let n=0;n<w*h;n++)if(!seen[n]&&data[n*4+3]>128){
   const todo=[n],group=[];seen[n]=1;let x0=w,y0=h,x1=0,y1=0,sx=0,sy=0;
   while(todo.length){const i=todo.pop(),x=i%w,y=Math.floor(i/w);group.push(i);sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const j of[x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(j>=0&&!seen[j]&&data[j*4+3]>128){seen[j]=1;todo.push(j);}}
   if(group.length<1000)continue;
   const col=Math.floor(sx/group.length/(w/8)),row=Math.floor(sy/group.length/(h/4)),idx=row*8+col;
   if(cells[idx])throw Error('Connected figures or duplicate frame '+key+':'+idx);
   if(x0<=1||y0<=1||x1>=w-2||y1>=h-2)throw Error('Original touches image edge '+key+':'+idx);
   const left=x0-3,top=y0-3,cw=x1-x0+7,ch=y1-y0+7,cut=createCanvas(cw,ch),cc=cut.getContext('2d'),pixels=cc.createImageData(cw,ch),mask=new Uint8Array(cw*ch);
   let mass=0,count=0,hairTop=y1;const mid=sx/group.length;
   for(const i of group){const x=i%w,y=Math.floor(i/w);if(y<y0+(y1-y0)*.24){mass+=x;count++;}if(Math.abs(x-mid)<w/8*.20&&y<y0+(y1-y0)*.55&&data[i*4]<110&&data[i*4+1]<105&&data[i*4+2]<100&&data[i*4+3]>220)hairTop=Math.min(hairTop,y);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)mask[(y-top+dy)*cw+x-left+dx]=1;}
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(mask[y*cw+x]){const src=((top+y)*w+left+x)*4,dst=(y*cw+x)*4;for(let c=0;c<4;c++)pixels.data[dst+c]=data[src+c];}
   cc.putImageData(pixels,0,0);cells[idx]={cut,cw,ch,center:(count?mass/count:(x0+x1)/2)-left,bodyHeight:hairTop<y1?y1-hairTop:y1-y0,source:{x0,y0,x1,y1},crossedCell:x0<col*w/8||x1>=(col+1)*w/8};
  }
  if(cells.filter(Boolean).length!==32)throw Error('Expected 32 complete figures: '+key+' got '+cells.filter(Boolean).length);
  const heights=cells.filter((c,i)=>i%8===0||i%8===7).map(c=>c.bodyHeight).sort((a,b)=>a-b),reference=heights[Math.floor(heights.length/2)];
  let scale=224/reference;for(const c of cells)scale=Math.min(scale,280/c.ch,168/Math.max(c.center,c.cw-c.center));
  const large=createCanvas(3072,1280),lc=large.getContext('2d');cells.forEach((c,i)=>{lc.drawImage(c.cut,i%8*384+192-c.center*scale,Math.floor(i/8)*320+304-c.ch*scale,c.cw*scale,c.ch*scale);});
  const out=createCanvas(1536,640),oc=out.getContext('2d');oc.drawImage(large,0,0,1536,640);const packed=oc.getImageData(0,0,1536,640).data;
  cells.forEach((c,i)=>{const col=i%8,row=Math.floor(i/8);let minX=192,minY=160,maxX=-1,maxY=-1;for(let y=0;y<160;y++)for(let x=0;x<192;x++)if(packed[((row*160+y)*1536+col*192+x)*4+3]>8){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}const margin=Math.min(minX,minY,191-maxX,159-maxY);if(margin<6)throw Error('Insufficient game-frame padding '+key+':'+i+' '+margin);report.frames.push({key,row,frame:col,bounds:{minX,minY,maxX,maxY},margin,source:c.source,recoveredAcrossCell:c.crossedCell});});
  fs.mkdirSync(path.join(root,'assets/atlas'),{recursive:true});fs.mkdirSync(path.join(root,'assets/atlas-webp'),{recursive:true});fs.writeFileSync(path.join(root,'assets/atlas',key+'.png'),out.toBuffer('image/png'));fs.writeFileSync(path.join(root,'assets/atlas-webp',key+'.webp'),out.toBuffer('image/webp',95));report.sheets.push({key,referenceBodyHeight:reference,scale,gameWidth:1536,gameHeight:640});console.log(key,'32 full frames, body reference',reference,'scale',scale.toFixed(3));
 }
 fs.writeFileSync(path.join(root,'docs/WEAPON-FRAME-SAFETY.json'),JSON.stringify(report,null,2));console.log('Verified',report.frames.length,'frames with padding');
})().catch(e=>{console.error(e);process.exitCode=1});
