/* Local CC0 surface maps; sources are documented in textures/README.md. */
window.MaterialSurfaces = (function () {
  var surfaces = {};
  var names = {
    stoneScan:{file:'sandstone_cracks'},leatherScan:{file:'brown_leather'},
    paperScan:{file:'Paper001',ao:false},plasterScan:{file:'white_plaster_02'},
    brushedScan:{file:'Metal009',ao:false},foilScan:{file:'Foil002'},
    ironScan:{file:'Metal063',ao:false},
    ceramicScan:{file:'ceramic',normal:'png',crop:[.014,.014,.072,.072]},
    waxScan:{file:'wax',normal:'png'}
  };
  var ready = Promise.all(Object.keys(names).map(async function (key) {
    var info=names[key];
    var maps = await Promise.all(['Diffuse','nor_gl','Rough','AO'].map(function (kind) {
      if(kind==='AO'&&info.ao===false)return null;
      return new Promise(function (resolve,reject) {
        var image = new Image();
        image.onload = function () {
          var canvas = document.createElement('canvas');
          var crop=info.crop||[0,0,1,1];
          canvas.width=Math.round(image.naturalWidth*crop[2]);canvas.height=Math.round(image.naturalHeight*crop[3]);
          var ctx=canvas.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(image,image.naturalWidth*crop[0],image.naturalHeight*crop[1],canvas.width,canvas.height,0,0,canvas.width,canvas.height);
          resolve(ctx.getImageData(0,0,canvas.width,canvas.height));
        };
        image.onerror=function(){reject(new Error('Could not load material: '+key+' / '+kind))};
        image.src='assets/textures/'+info.file+'-'+kind+'.'+(kind==='nor_gl'&&info.normal?info.normal:'jpg');
      });
    }));
    var mean=[0,0,0], data=maps[0].data;
    for(var i=0;i<data.length;i+=4)for(var k=0;k<3;k++)mean[k]+=data[i+k];
    for(var k=0;k<3;k++)mean[k]/=data.length/4;
    var width=maps[0].width,height=maps[0].height,packed=new Uint8Array(width*height*8);
    for(var i=0;i<width*height;i++){
      var p=i*4,o=i*8;
      for(var k=0;k<3;k++){packed[o+k]=maps[0].data[p+k];packed[o+3+k]=maps[1].data[p+k]}
      packed[o+6]=maps[2].data[p];packed[o+7]=maps[3]?maps[3].data[p]:255;
    }
    surfaces[key]={data:packed,width:width,height:height,mean:mean};
  }));
  function shader(state,board,surface) {
    var asset=surfaces[state.texture];
    if(!asset)return null;
    var data=asset.data,mapW=asset.width,mapH=asset.height,mean=asset.mean,stone=state.texture==='stoneScan';
    var cropped=!!names[state.texture].crop;
    var paper=state.material==='paper',plaster=state.material==='plaster',wax=state.material==='wax',ceramic=state.material==='ceramic';
    var gold=state.material==='gold',toxic=state.material==='toxic',iron=state.material==='iron';
    var metal=gold||toxic||iron||state.material==='silver'||state.material==='chrome';
    var amount=state.textureStrength/100, detail=state.textureDetail/100, age=state.weathering/100;
    var sheen=state.surfaceSheen/100,matte=paper||plaster;
    var tile=Math.min(board.w,board.h)*(.35+state.textureScale/100*1.3);
    var angle=state.angle*Math.PI/180,z=.12+state.lightHeight/46,inv=1/Math.sqrt(1+z*z);
    var lx=Math.cos(angle)*inv,ly=Math.sin(angle)*inv,lz=z*inv;
    var ambient=state.ambient/100, shine=state.shine/100, rough=state.rough/100;
    var rotation=state.reflectionRotation*Math.PI/180,rc=Math.cos(rotation),rs=Math.sin(rotation);
    var frequency=10.5-state.reflectionScale/100*9.25,variation=state.reflectionTexture/100;
    var repeats=Math.max(1,Math.round(3-state.textureScale/50));
    var tileW=board.tileW?board.tileW/repeats:tile,tileH=board.tileH?board.tileH/repeats:tile;
    var halfInv=1/Math.sqrt(2+2*lz),shadeInv=1/((ambient+lz*(1-ambient))||1);
    var meanSum=mean[0]+mean[1]+mean[2],meanLuma=mean[0]*.299+mean[1]*.587+mean[2]*.114;
    var tint=gold?[1,.77,.34]:toxic?[.66,.9,.61]:[1,1,1];
    var dirtTint=stone?[9,12,16]:[3,5,7],lightTint=[255,250,239];
    var values=new Float32Array(8),rgb=new Float32Array(3);
    return function(x,y,gx,gy,cavity,relief) {
      relief=relief||0;
      var u=(x-board.x)/tileW,v=(y-board.y)/tileH;
      // All maps share board coordinates, including the flat surface and relief.
      u-=Math.floor(u);v-=Math.floor(v);
      var flipX=1,flipY=1;
      if(cropped){
        flipX=u<.5?1:-1;flipY=v<.5?1:-1;
        u=1-Math.abs(u*2-1);v=1-Math.abs(v*2-1);
      }
      var fx=u*(cropped?mapW-1:mapW),fy=v*(cropped?mapH-1:mapH);
      var x0=Math.floor(fx),y0=Math.floor(fy),x1=(x0+1)%mapW,y1=(y0+1)%mapH;
      var tx=fx-x0,ty=fy-y0,p00=(y0*mapW+x0)*8,p10=(y0*mapW+x1)*8,p01=(y1*mapW+x0)*8,p11=(y1*mapW+x1)*8;
      var w00=(1-tx)*(1-ty),w10=tx*(1-ty),w01=(1-tx)*ty,w11=tx*ty;
      for(var k=0;k<8;k++)values[k]=data[p00+k]*w00+data[p10+k]*w10+data[p01+k]*w01+data[p11+k]*w11;
      var ao=1-values[7]/255, stain=Math.max(0,1-(values[0]+values[1]+values[2])/meanSum);
      var dirt=age*Math.min(.65,(ao*.55+stain*.5)*amount+cavity*.7);
      var polish=sheen*(1-dirt)*(1-cavity*.65)*(.45+relief*.55);
      var bump=amount*(stone?(.04+detail*.24):ceramic?(.02+detail*.12):wax?(.035+detail*.18):(.12+detail*.65))*(1-polish*.45);
      var nz=Math.max(.3,values[5]/127.5-1);
      var nx=gx+(values[3]/127.5-1)*bump/nz*flipX;
      var ny=gy-(values[4]/127.5-1)*bump/nz*flipY;
      var norm=1/Math.sqrt(nx*nx+ny*ny+1),diff=Math.max(0,(nx*lx+ny*ly+lz)*norm);
      var localRough=Math.max(.12,Math.min(1,rough+(values[6]/255-.5)*amount*.45+dirt*.45+cavity*.12-polish*.2));
      var half=Math.min(1,Math.max(0,(nx*lx+ny*ly+(lz+1))*norm*halfInv));
      var spec=Math.pow(half,12+(1-localRough)*140)*shine*(matte?10:55)*(1-dirt);
      var ex=board.tileW?((x-board.x)/board.tileW%1+1)%1:(x-board.x)/board.w;
      var ey=board.tileH?((y-board.y)/board.tileH%1+1)%1:(y-board.y)/board.h;
      var px=ex-.5,py=ey-.5;
      // A broad softbox reflection, attenuated by dirt and local roughness.
      var position=board.tileW?Math.sin(ex*Math.PI*2)*.2+Math.cos(ey*Math.PI*2)*.12:(px*lx+py*ly)*1.4;
      var reflectedAxis=(nx*lx+ny*ly)*norm*1.6+position;
      var width=.09+localRough*.3;
      var softbox=Math.exp(-Math.pow((reflectedAxis-.08)/width,2));
      var fresnel=.04+.96*Math.pow(1-norm,5);
      var coat=sheen*shine*(1-dirt)*(1-cavity*.65)*(matte?.08:1);
      var glaze=softbox*coat*(.13+(1-localRough)*.2)+fresnel*coat*.22;
      var shade=ambient+diff*(1-ambient);
      // Normalize to the flat-surface light level so the editable base stays useful.
      shade*=shadeInv;
      // Keep large-scale relief shading visible through the material's reflection.
      var macroNorm=1/Math.sqrt(gx*gx+gy*gy+1);
      var macroLight=Math.max(0,(gx*lx+gy*ly+lz)*macroNorm);
      var reliefShade=1+(macroLight-lz)*.85*(1-ambient*.65)-cavity*.13;
      var environment=0;
      if(metal){
        var rx=px*rc-py*rs,ry=px*rs+py*rc;
        var rnX=(nx*rc-ny*rs)*norm,rnY=(nx*rs+ny*rc)*norm;
        var phase=board.tileW?Math.PI*2*(ex*Math.max(1,Math.round(frequency*.4))+ey*Math.max(1,Math.round(frequency*.3))):ry*frequency*Math.PI*2;
        var wave=(Math.sin(phase+rnX*(2+variation*5)+state.angle*.012)+1)*.5;
        var cross=(Math.sin((board.tileW?ex*Math.PI*2:rx*frequency*2.4)-rnY*3+state.angle*.008)+1)*.5;
        environment=wave*(.76-variation*.25)+cross*(.12+variation*.25)+softbox*.2;
        if(toxic)environment=(Math.sin(environment*5+rnX*4-rnY*3)+1)*.5;
        environment=Math.max(0,Math.min(1,.5+(environment-.5)*(1-localRough*.72)));
      }
      var lumaRatio=(values[0]*.299+values[1]*.587+values[2]*.114)/meanLuma;
      for(var k=0;k<3;k++){
        var ratio=wax||metal||ceramic?lumaRatio:values[k]/mean[k];
        var albedo=surface[k]*(1+(ratio-1)*amount*(stone?.55:metal?.22:.7));
        var value=albedo*shade*(1-dirt)-dirt*dirtTint[k];
        if(metal){
          var reflected=(24+environment*222)*tint[k]*(1-dirt*.7);
          var reflectAmount=(iron?.48:.82)*shine;
          value=value*(1-reflectAmount)+reflected*reflectAmount+spec*tint[k]*.5;
        }else{
          value=value*(1-glaze)+lightTint[k]*glaze+spec;
          if(wax)value+=albedo*(.045+.07*(1-diff))*(1-cavity)*sheen;
        }
        rgb[k]=Math.max(0,Math.min(255,value*reliefShade));
      }
      return rgb;
    };
  }
  return {ready:ready,has:function(key){return !!surfaces[key]},supports:function(key){return !!names[key]},shader:shader};
})();
