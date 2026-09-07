window.HighlightFinish = (function(){
  function extract(ctx,rect,boost){
    var scale=Math.min(1,720/Math.max(rect.w,rect.h)),w=Math.max(2,Math.round(rect.w*scale)),h=Math.max(2,Math.round(rect.h*scale));
    var source=document.createElement('canvas');source.width=w;source.height=h;
    var sc=source.getContext('2d',{willReadFrequently:true});
    sc.drawImage(ctx.canvas,rect.x,rect.y,rect.w,rect.h,0,0,w,h);
    var pixels=sc.getImageData(0,0,w,h),d=pixels.data;
    var blurred=document.createElement('canvas');blurred.width=w;blurred.height=h;
    var bc=blurred.getContext('2d',{willReadFrequently:true});
    bc.filter='blur('+Math.max(2,Math.min(w,h)*.009)+'px)';bc.drawImage(source,0,0);
    var bd=bc.getImageData(0,0,w,h).data,mask=new Float32Array(w*h),hist=new Uint32Array(256);
    for(var i=0;i<d.length;i+=4)hist[Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114)]++;
    var total=0,cut=0;
    while(cut<255&&total<w*h*.85)total+=hist[cut++];
    var threshold=Math.max(90,Math.min(190,cut-32));
    var glow=document.createElement('canvas');glow.width=w;glow.height=h;
    var gc=glow.getContext('2d'),emission=gc.createImageData(w,h),ed=emission.data;
    var cells={},cellSize=Math.max(16,Math.round(Math.min(w,h)*.09));
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      var j=y*w+x,p=j*4,lum=d[p]*.299+d[p+1]*.587+d[p+2]*.114;
      var local=bd[p]*.299+bd[p+1]*.587+bd[p+2]*.114;
      var bright=Math.max(0,Math.min(1,(lum-threshold)/Math.max(30,245-threshold)));
      var contrast=Math.max(0,Math.min(1,(lum-local-1.5)/26));
      var m=Math.sqrt(bright)*contrast;mask[j]=m;
      for(var k=0;k<3;k++)ed[p+k]=d[p+k]+(255-d[p+k])*boost*.7;
      ed[p+3]=Math.round(m*255);
      if(m>.25&&x>2&&y>2&&x<w-3&&y<h-3){
        var key=Math.floor(x/cellSize)+'|'+Math.floor(y/cellSize),score=m*lum/255;
        if(!cells[key]||score>cells[key].score)cells[key]={x:x,y:y,score:score};
      }
    }
    gc.putImageData(emission,0,0);
    return {canvas:glow,mask:mask,width:w,height:h,rect:rect,peaks:Object.values(cells).sort(function(a,b){return b.score-a.score})};
  }
  function sample(field,x,y){
    var r=field.rect;
    if(x<r.x||y<r.y||x>=r.x+r.w||y>=r.y+r.h)return 0;
    var fx=Math.max(0,Math.min(field.width-1,(x-r.x+.5)/r.w*field.width-.5));
    var fy=Math.max(0,Math.min(field.height-1,(y-r.y+.5)/r.h*field.height-.5));
    var ix=Math.floor(fx),iy=Math.floor(fy),jx=Math.min(field.width-1,ix+1),jy=Math.min(field.height-1,iy+1),tx=fx-ix,ty=fy-iy,m=field.mask,w=field.width;
    return (m[iy*w+ix]*(1-tx)+m[iy*w+jx]*tx)*(1-ty)+(m[jy*w+ix]*(1-tx)+m[jy*w+jx]*tx)*ty;
  }
  function draw(ctx,field,boost,bloom,metal){
    var r=field.rect,min=Math.min(r.w,r.h),glow=Math.min(1,bloom+boost*.18);
    ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.globalCompositeOperation='screen';
    if(glow){
      ctx.globalAlpha=glow*.72;ctx.filter='blur('+Math.max(.6,min*.0025)+'px)';
      ctx.drawImage(field.canvas,r.x,r.y,r.w,r.h);
      ctx.globalAlpha=glow*.62;ctx.filter='blur('+Math.max(1,min*(.006+bloom*.012))+'px)';
      ctx.drawImage(field.canvas,r.x,r.y,r.w,r.h);
    }
    ctx.filter='none';
    if(metal&&boost>.65){
      var strength=(boost-.65)/.35,selected=[],limit=Math.ceil(strength*6),radius=Math.min(field.width,field.height)*.13;
      for(var i=0;i<field.peaks.length&&selected.length<limit;i++){
        var peak=field.peaks[i];
        if(selected.some(function(p){return Math.hypot(p.x-peak.x,p.y-peak.y)<radius}))continue;
        selected.push(peak);
        var x=r.x+(peak.x+.5)/field.width*r.w,y=r.y+(peak.y+.5)/field.height*r.h;
        var length=min*(.006+strength*.018)*(.65+peak.score*.35),thin=Math.max(.6,min*.0008);
        ctx.save();ctx.translate(x,y);ctx.rotate(-.45);ctx.globalAlpha=strength*.85;
        for(var axis=0;axis<2;axis++){
          var gradient=ctx.createLinearGradient(-length,0,length,0);gradient.addColorStop(0,'rgba(220,235,255,0)');gradient.addColorStop(.5,'rgba(255,255,255,1)');gradient.addColorStop(1,'rgba(220,235,255,0)');
          ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(-length,0);ctx.lineTo(0,-thin);ctx.lineTo(length,0);ctx.lineTo(0,thin);ctx.closePath();ctx.fill();ctx.rotate(Math.PI/2);length*=.65;
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
  return {extract:extract,sample:sample,draw:draw};
})();
