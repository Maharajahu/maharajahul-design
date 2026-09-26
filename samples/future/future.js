const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const worlds = {
  orbis: { mode: 0, category: 'ORBITAL ENVIRONMENTS', eyebrow: 'THE NEXT FRONTIER IS A FEELING.', title: 'NOT FARTHER.<br><em>BEYOND.</em>', description: 'A world that exists only in light.<br>Trace its rings. Turn its sun. Find another perspective.', caption: 'AN IMAGINARY DESTINATION', object: 'RING SYSTEM / PROCEDURAL', instrument: 'SECTOR 01 / OPEN SPACE', parameter: 'SUN ANGLE', value: 40, variants: ['Azure','Ember','Ice'], action: 'Enter orbit', readout: 'SUN AZIMUTH' },
  morph: { mode: 1, category: 'IMPOSSIBLE MATERIALS', eyebrow: 'FORM IS ONLY A TEMPORARY STATE.', title: 'MAKE<br>MATTER<br><em>MOVE.</em>', description: 'Cold metal. An almost living surface.<br>Change the tension. Watch the familiar come undone.', caption: 'A STUDY IN LIQUID CHROME', object: 'CONTINUOUS SURFACE / RAY MARCHED', instrument: 'MATERIAL LAB / 02', parameter: 'SURFACE TENSION', value: 48, variants: ['Chrome','Opal','Obsidian'], action: 'Inspect material', readout: 'DEFORMATION' },
  synapse: { mode: 2, category: 'CONNECTED SYSTEMS', eyebrow: 'ONE SIGNAL. A THOUSAND POSSIBILITIES.', title: 'Intelligence.<br><em>In formation.</em>', description: 'A living lattice, suspended between order and possibility.<br>Build its connections. Send a signal through the structure.', caption: 'A NETWORK, NOT AN AI MODEL', object: '125 VERTICES / SPATIAL PROJECTION', instrument: 'SIGNAL ARRAY / 03', parameter: 'CONNECTIVITY', value: 66, variants: ['Emerald','Ultraviolet','Amber'], action: 'Fire a signal', readout: 'ACTIVE CONNECTIONS' },
  velocity: { mode: 3, category: 'KINETIC ENVIRONMENTS', eyebrow: 'THERE IS NO ORDINARY WAY FORWARD.', title: 'OUTRUN<br><em>ORDINARY.</em>', description: 'A corridor made of motion.<br>Set the intensity. Pull the horizon a little closer.', caption: 'A HYPERSPACE SKETCH', object: 'INFINITE CORRIDOR / POLAR FIELD', instrument: 'TRANSIT PROTOCOL / 04', parameter: 'DRIVE INTENSITY', value: 38, variants: ['Solar','Ion','Violet'], action: 'Make the jump', readout: 'DRIVE INTENSITY' },
  chroma: { mode: 4, category: 'OPTICAL OBJECTS', eyebrow: 'SOME THINGS ONLY EXIST IN THE LIGHT.', title: 'Less object.<br><em>More wonder.</em>', description: 'An impossible cut. A spectrum held in suspension.<br>Rotate the crystal. Find the colour between the colours.', caption: 'AN EXPERIMENT IN OPTICAL FORM', object: 'FACETED SOLID / SPECTRAL SHADING', instrument: 'OPTICS LAB / 05', parameter: 'DISPERSION', value: 63, variants: ['Spectrum','Glacier','Rose'], action: 'Look closer', readout: 'DISPERSION' },
  lucent: { mode: 5, category: 'LIQUID INTERFACES', eyebrow: 'LIGHT YOU CAN ALMOST TOUCH.', title: 'Clarity.<br><em>In motion.</em>', description: 'A softer edge between you and your world.<br>Glass that bends the landscape. Light that follows your touch.', caption: 'A LIQUID GLASS INTERPRETATION', object: 'SCREEN-SPACE REFRACTION', instrument: 'MATERIAL STUDY / 06', parameter: 'GLASS DEPTH', value: 64, variants: ['Clear','Frosted','Smoked'], action: 'Explore the glass', readout: 'OPTICAL DEPTH' },
};
const media = matchMedia('(prefers-reduced-motion: reduce)');
const state = { name: 'orbis', time: 1.4, paused: media.matches, value: 40, variant: 0, focused: false, pulse: 0, pointer: [0,0], lightScene: 0, brightness: 0.78 };
const glassPanes = $$('#glass-interface .glass-pane');
const glassRects = new Float32Array(20);
const glassRadii = new Float32Array(5);
const gpu = $('#gpu');
const network = $('#network');
const ctx = network.getContext('2d');
let gl;
let program;
let rendererError = '';
let locations;
let width = 1;
let height = 1;
let request = 0;
let previous = 0;

const vertexSource = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragmentSource = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_value;
uniform float u_focus;
uniform float u_pulse;
uniform float u_mobile;
uniform int u_mode;
uniform int u_variant;
uniform vec4 u_panels[5];
uniform float u_radii[5];
uniform float u_scale;
uniform float u_brightness;
uniform int u_light_scene;
const float PI = 3.14159265;
mat2 turn(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float hash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x+p.y)*p.z); }
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float terrain(vec3 p) {
  float n=0.0, weight=0.55;
  for(int i=0;i<6;i++) { n+=weight*noise(p); p=p*2.04+vec3(1.7,2.8,0.6); weight*=0.48; }
  return n;
}
vec3 stars(vec2 uv) {
  vec2 cell=uv*vec2(290.0,180.0);
  float seed=hash(vec3(floor(cell),1.0));
  float sparkle=exp(-dot(fract(cell)-0.5,fract(cell)-0.5)*280.0)*step(0.986,seed);
  vec3 sky=vec3(0.009,0.019,0.034);
  sky+=vec3(0.012,0.033,0.06)*exp(-length(uv-vec2(0.55,0.4))*3.0);
  return sky+sparkle*mix(vec3(0.4,0.6,1.0),vec3(1.0,0.88,0.7),seed)*0.6;
}
vec3 studio(vec3 direction) {
  vec3 result=mix(vec3(0.012,0.018,0.038),vec3(0.38,0.44,0.58),smoothstep(-0.2,0.22,direction.y));
  float strip=pow(max(0.0,1.0-abs(direction.x+0.28)*4.6),5.0);
  strip*=smoothstep(-0.25,0.3,direction.y);
  result+=vec3(3.1,3.4,4.0)*strip;
  result+=vec3(1.1,0.55,1.65)*pow(max(dot(direction,normalize(vec3(0.7,0.25,0.55))),0.0),28.0);
  result+=vec3(1.0,1.65,2.1)*pow(max(dot(direction,normalize(vec3(-0.8,-0.1,0.45))),0.0),35.0);
  result+=vec3(0.65,0.8,1.0)*(1.0-smoothstep(0.02,0.075,abs(direction.y+0.36)));
  vec2 window=direction.xy/max(abs(direction.z),0.18);
  float softbox=(1.0-smoothstep(0.48,0.54,abs(window.x-0.8)))*(1.0-smoothstep(0.65,0.72,abs(window.y-0.6)));
  float mullion=smoothstep(0.015,0.025,abs(fract(window.x*4.0)-0.5));
  result+=vec3(2.4,2.3,2.05)*softbox*mullion;
  result*=0.94+0.06*sin(direction.y*38.0+direction.x*6.0);
  return result;
}
vec3 glassRoom(vec3 direction) {
  vec3 color=mix(vec3(0.30,0.35,0.48),vec3(0.96,0.97,1.0),smoothstep(-0.4,0.55,direction.y));
  float panel=(1.0-smoothstep(0.07,0.16,abs(direction.x-0.3)))*smoothstep(-0.6,0.15,direction.z);
  color*=1.0-panel*0.85;
  color+=vec3(0.18,0.11,0.24)*pow(max(dot(direction,normalize(vec3(-0.8,0.1,0.5))),0.0),12.0);
  color+=vec3(0.05,0.19,0.23)*pow(max(dot(direction,normalize(vec3(0.7,-0.1,0.5))),0.0),18.0);
  float light=(1.0-smoothstep(0.01,0.035,abs(direction.y+0.3)));
  return color+vec3(0.65,0.75,0.9)*light;
}
vec3 objectPoint(vec3 p) {
  p.xz=turn(u_time*0.19+u_pointer.x*0.65)*p.xz;
  p.yz=turn(0.55+u_pointer.y*0.35)*p.yz;
  return p;
}
float shape(vec3 p) {
  p=objectPoint(p);
  if(u_mode==1) {
    p.xy=turn(-0.35)*p.xy;
    p.xy=turn(p.z*(0.4+u_value*2.7))*p.xy;
    float d=length(vec2(length(p.xz)-0.88,p.y))-0.31;
    return d+0.026*sin(p.x*7.0+u_time*0.6)*sin(p.y*9.0)*sin(p.z*6.0);
  }
  vec3 rounded=sqrt(p*p*vec3(1.0,0.4356,1.0)+vec3(0.005));
  return (rounded.x+rounded.y+rounded.z-1.30)*0.5;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(0.002,0.0);
  return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
}
vec3 planet(vec2 uv,vec2 screen) {
  vec3 ro=vec3(0.0,0.0,5.0-u_focus*0.85);
  vec3 rd=normalize(vec3(uv,-2.45));
  vec3 color=stars(screen);
  float radius=1.12, b=dot(ro,rd), c=dot(ro,ro)-radius*radius, discriminant=b*b-c;
  float hit=1000.0;
  vec3 atmosphere=u_variant==1?vec3(0.65,0.14,0.04):u_variant==2?vec3(0.22,0.38,0.65):vec3(0.05,0.27,0.62);
  float proximity=length(cross(ro,rd));
  color+=atmosphere*0.36*exp(-max(proximity-radius,0.0)*17.0)*step(radius,proximity);
  if(discriminant>0.0) {
    hit=-b-sqrt(discriminant);
    vec3 p=ro+hit*rd, n=normalize(p), landNormal=n;
    landNormal.xz=turn(u_time*0.045+u_pointer.x*0.6)*landNormal.xz;
    landNormal.yz=turn(0.25+u_pointer.y*0.25)*landNormal.yz;
    float continental=terrain(landNormal*3.8+vec3(2.5,0.2,1.1));
    float relief=terrain(landNormal*38.0);
    float land=smoothstep(0.481,0.494,continental+relief*0.035);
    vec3 ocean=vec3(0.013,0.077,0.15);
    vec3 earth=mix(vec3(0.09,0.17,0.11),vec3(0.33,0.30,0.19),smoothstep(0.48,0.65,continental));
    if(u_variant==1) { ocean=vec3(0.15,0.035,0.015); earth=mix(vec3(0.27,0.06,0.026),vec3(0.58,0.28,0.12),continental); }
    if(u_variant==2) { ocean=vec3(0.06,0.14,0.21); earth=vec3(0.5,0.65,0.7); }
    float coast=exp(-abs(continental+relief*0.035-0.49)*185.0);
    ocean=mix(ocean,vec3(0.05,0.31,0.34),coast*0.7);
    earth*=0.6+relief*0.9;
    float mountains=pow(1.0-abs(relief*2.0-1.0),8.0)*smoothstep(0.53,0.62,continental);
    earth=mix(earth,vec3(0.52,0.48,0.38),mountains*0.6);
    vec3 surface=mix(ocean,earth,land);
    float polar=smoothstep(0.76,0.95,abs(landNormal.y)+0.1*continental);
    surface=mix(surface,vec3(0.7,0.81,0.82),polar);
    float phi=u_value*PI;
    vec3 light=normalize(vec3(-sin(phi),0.45,cos(phi)));
    vec3 cloudPoint=landNormal*9.0+vec3(u_time*0.008,0.0,0.0);
    cloudPoint.x+=sin(landNormal.y*12.0)*0.42;
    float cloud=smoothstep(0.56,0.68,terrain(cloudPoint));
    float cloudShadow=smoothstep(0.55,0.68,terrain(cloudPoint+light*0.14));
    surface*=1.0-cloudShadow*0.46;
    surface=mix(surface,vec3(0.88,0.89,0.86),cloud*0.94);
    float diffuse=max(dot(n,light),0.0);
    color=surface*(0.025+1.65*diffuse);
    float cities=pow(noise(landNormal*240.0),18.0)*land*(1.0-cloud)*(1.0-smoothstep(-0.18,0.12,dot(n,light)));
    color+=vec3(1.0,0.61,0.24)*cities*2.5;
    color+=vec3(0.75,0.84,1.0)*pow(max(dot(reflect(-light,n),-rd),0.0),55.0)*(1.0-land)*0.4;
    color+=atmosphere*pow(1.0-max(dot(n,-rd),0.0),3.8)*(0.3+diffuse)*1.4;
  }
  vec3 plane=normalize(vec3(0.25,0.90,0.35));
  float ringT=-dot(ro,plane)/dot(rd,plane);
  vec3 ringP=ro+rd*ringT;
  float ringR=length(ringP);
  if(ringT>0.0&&ringT<hit&&ringR>1.42&&ringR<1.98) {
    float band=0.34+0.28*sin(ringR*165.0)+0.16*sin(ringR*490.0)+0.08*sin(ringR*1170.0);
    band=clamp(band+noise(ringP*650.0)*0.22,0.12,0.95);
    float edge=smoothstep(1.42,1.48,ringR)*(1.0-smoothstep(1.91,1.98,ringR));
    float gap=1.0-0.8*exp(-pow((ringR-1.72)*100.0,2.0));
    vec3 ringColor=u_variant==1?vec3(0.9,0.49,0.24):u_variant==2?vec3(0.65,0.76,0.88):vec3(0.43,0.66,0.82);
    vec3 sun=normalize(vec3(-sin(u_value*PI),0.45,cos(u_value*PI)));
    float shadowDistance=length(ringP-sun*max(dot(ringP,sun),0.0));
    float shadow=mix(0.16,1.0,smoothstep(1.02,1.18,shadowDistance));
    color=mix(color,ringColor*band*shadow,edge*gap*0.91);
  }
  return color;
}
vec3 objectScene(vec2 uv) {
  bool glass=u_mode==4;
  vec3 ro=vec3(0.0,0.0,(glass?5.9:4.7)-u_focus*0.8);
  vec3 rd=normalize(vec3(uv,-2.35));
  vec3 color=glass?vec3(0.84,0.85,0.90):vec3(0.015,0.008,0.025);
  float halo=exp(-dot(uv,uv)*1.8);
  color+=glass?vec3(0.04,0.025,0.045)*halo:vec3(0.09,0.04,0.13)*halo;
  float floorShadow=exp(-pow((uv.y+0.88)*9.0,2.0)-uv.x*uv.x*2.0);
  color*=1.0-floorShadow*(glass?0.17:0.5);
  float distance=0.0;
  bool found=false;
  for(int step=0;step<84;step++) {
    vec3 point=ro+rd*distance;
    float d=shape(point);
    if(d<0.0015) { found=true; break; }
    distance+=max(d*0.70,0.0008);
    if(distance>8.5) break;
  }
  if(found) {
    vec3 p=ro+rd*distance, n=normalAt(p), reflected=reflect(rd,n);
    float facing=max(dot(n,-rd),0.0);
    float rim=pow(1.0-facing,4.0);
    vec3 reflection=studio(reflected);
    if(!glass) {
      vec3 local=objectPoint(p);
      vec3 grain=vec3(noise(local*190.0),noise(local.yzx*190.0),noise(local.zxy*190.0))-0.5;
      vec3 brushed=normalize(n+grain*0.012);
      reflection=mix(reflection,studio(reflect(rd,brushed)),0.48);
      vec3 tint=vec3(0.90,0.92,0.98);
      if(u_variant==1) tint=0.48+0.52*cos(6.283*(vec3(0.05,0.39,0.68)+facing*0.75+p.y*0.13));
      if(u_variant==2) tint=vec3(0.09,0.07,0.16);
      float ao=clamp(shape(p+n*0.15)/0.15,0.1,1.0)*clamp(shape(p+n*0.32)/0.32,0.4,1.0);
      color=reflection*tint*(0.7+0.3*rim)*(0.6+0.4*ao);
      color+=vec3(0.25,0.12,0.35)*rim;
      color*=0.96+0.04*noise(local*320.0);
      color=color/(color+vec3(0.72));
    } else {
      float ior=1.35+u_value*0.22;
      vec3 internal=refract(rd,n,1.0/ior);
      vec3 start=p-n*0.015;
      float travel=0.02;
      for(int j=0;j<44;j++) {
        float inner=shape(start+internal*travel);
        if(inner>0.0) break;
        travel+=max(-inner*0.9,0.008);
      }
      vec3 exitNormal=normalAt(start+internal*travel);
      vec3 transmitted=refract(internal,-exitNormal,ior);
      if(dot(transmitted,transmitted)<0.01) transmitted=reflect(internal,exitNormal);
      float spread=0.015+u_value*0.17;
      vec3 shift=vec3(spread,spread*0.3,0.0);
      vec3 spectrum=vec3(glassRoom(normalize(transmitted+shift)).r,
        glassRoom(transmitted).g,glassRoom(normalize(transmitted-shift)).b);
      vec3 absorption=vec3(0.11,0.06,0.08);
      if(u_variant==1) absorption=vec3(0.35,0.06,0.02);
      if(u_variant==2) absorption=vec3(0.02,0.29,0.15);
      spectrum*=exp(-absorption*travel);
      float internalReflection=pow(1.0-abs(dot(internal,exitNormal)),4.0);
      spectrum=mix(spectrum,glassRoom(reflect(internal,exitNormal)),internalReflection*0.27);
      float fresnel=0.045+0.955*rim;
      color=mix(spectrum,reflection/(reflection+0.5),fresnel*0.85+0.08);
      color+=vec3(0.8,0.9,1.0)*pow(max(dot(reflected,normalize(vec3(-0.4,0.7,0.65))),0.0),85.0)*0.55;
      color*=0.72+0.28*abs(dot(n,normalize(vec3(-0.25,0.6,0.7))));
      vec3 local=objectPoint(p);
      float seam=min(abs(local.x),min(abs(local.y)*0.66,abs(local.z)));
      float polishedEdge=exp(-seam*43.0);
      vec3 edgeColor=0.65+0.35*cos(vec3(0.0,2.1,4.2)+local.y*2.3+u_value*2.0);
      color+=edgeColor*polishedEdge*0.58;
      color+=vec3(0.75,0.88,1.0)*pow(polishedEdge,3.0)*0.2;
      vec3 interiorLight=0.55+0.45*cos(vec3(0.0,2.1,4.2)+transmitted.y*2.0+local.y*1.2);
      color=mix(color,color*interiorLight*1.45,0.22*u_value);
    }
  }
  return color;
}
vec3 tunnel(vec2 uv) {
  uv+=u_pointer*0.05;
  float radial=length(uv);
  float radius=max(abs(uv.x)*0.93+abs(uv.y)*0.33,abs(uv.y)*0.93+abs(uv.x)*0.33);
  float depth=1.2/max(radius,0.06);
  float angle=atan(uv.y,uv.x)+0.1*sin(depth*0.18+u_time*0.12);
  float speed=1.3+u_value*8.0;
  float phase=depth*5.0-u_time*speed-u_pulse*4.0;
  float rail=pow(0.5+0.5*cos(angle*12.0),110.0);
  float rings=pow(0.5+0.5*cos(phase),32.0);
  float nodes=pow(0.5+0.5*cos(angle*24.0+0.5),22.0)*pow(0.5+0.5*cos(phase*0.5),10.0);
  vec2 panelUV=vec2(angle*6.0/PI,phase/(2.0*PI));
  vec2 panel=abs(fract(panelUV)-0.5);
  float seam=max(smoothstep(0.46,0.495,panel.x),smoothstep(0.455,0.49,panel.y));
  float brushed=noise(vec3(panelUV.x*110.0,panelUV.y*3.0,1.0));
  float bevel=exp(-abs(panel.x-0.43)*100.0)+exp(-abs(panel.y-0.43)*100.0);
  vec3 hot=vec3(1.0,0.39,0.12), cold=vec3(0.32,0.15,0.8);
  if(u_variant==1) { hot=vec3(0.12,0.9,1.0); cold=vec3(0.1,0.26,0.7); }
  if(u_variant==2) { hot=vec3(0.89,0.24,1.0); cold=vec3(0.19,0.24,0.9); }
  vec3 hue=mix(cold,hot,0.5+0.5*sin(angle*2.0+depth*0.13));
  float fade=smoothstep(0.055,0.35,radial);
  vec3 color=mix(vec3(0.028,0.035,0.055),vec3(0.1,0.105,0.13),brushed*0.4+bevel*0.28)*(1.0-seam*0.8);
  color*=0.5+0.5*fade;
  color+=hue*(rail*1.35+rings*0.75+nodes*0.9)*fade;
  color+=hue*pow(0.5+0.5*cos(angle*12.0),8.0)*0.12*fade;
  color+=hue*bevel*0.045*fade;
  color+=vec3(1.0,0.9,0.79)*pow(rings,8.0)*pow(rail,0.4)*1.8*fade;
  color+=hot*exp(-radial*5.0)*0.22;
  color*=1.0+u_pulse*0.35;
  return color/(color+0.75);
}
float duneHeight(vec2 p) {
  float sweep=p.x*2.8+sin(p.y*1.35)*1.35+sin(p.y*0.47)*2.3;
  return pow(0.5+0.5*sin(sweep),2.3)*0.58+sin(p.y*0.72+p.x*0.5)*0.16;
}
vec3 landscape(vec2 uv) {
  vec2 p=(uv-0.5)*vec2(u_resolution.x/u_resolution.y,1.0)*6.5;
  p=turn(-0.42)*p+vec2(0.3,-0.4)+u_pointer*0.07;
  p.x+=sin(u_time*0.055)*0.07;
  float elevation=duneHeight(p);
  vec2 slope=vec2(duneHeight(p+vec2(0.009,0.0))-elevation,duneHeight(p+vec2(0.0,0.009))-elevation)/0.009;
  vec3 normal=normalize(vec3(-slope*1.3,1.0));
  vec3 sun=normalize(vec3(-0.6,0.72,0.7));
  float diffuse=max(dot(normal,sun),0.0);
  float ripple=sin(p.x*230.0+sin(p.y*7.0)*5.0+elevation*55.0)*0.018;
  float shadow=1.0-smoothstep(0.03,0.18,duneHeight(p+sun.xy*0.30)-elevation)*0.48;
  vec3 sand=mix(vec3(0.25,0.30,0.32),vec3(0.96,0.72,0.45),0.26+diffuse*0.74)*shadow;
  sand+=ripple*diffuse+vec3(0.045)*hash(vec3(p*760.0,1.0));
  float coastline=p.y+0.58*sin(p.x*0.75)+0.18*sin(p.x*1.8)+0.65;
  float land=smoothstep(-0.06,0.08,coastline);
  float waves=sin(p.x*12.0+sin(p.y*7.0)+u_time*0.16)*sin(p.y*26.0-p.x*4.0-u_time*0.24);
  vec3 water=mix(vec3(0.025,0.18,0.22),vec3(0.10,0.40,0.43),exp(-abs(coastline)*0.7));
  float foam=pow(0.5+0.5*sin(coastline*65.0+sin(p.x*12.0)*0.25-u_time*0.4),18.0)*exp(-abs(coastline+0.16)*9.0);
  water+=vec3(0.60,0.75,0.70)*foam*0.5;
  water+=pow(max(waves,0.0),14.0)*vec3(0.21,0.30,0.28);
  vec3 color=mix(water,sand,land);
  if(u_light_scene==1) color=mix(color*vec3(0.79,0.61,1.12),vec3(0.68,0.28,0.25)*diffuse,land*0.33);
  if(u_light_scene==2) color=mix(color*vec3(0.29,0.42,0.69),vec3(0.04,0.11,0.20),0.2);
  return color*(0.44+u_brightness*0.84);
}
float roundedPanel(vec2 p,vec2 halfSize,float radius) {
  vec2 q=abs(p)-halfSize+radius;
  return length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
}
vec3 liquidGlass(vec2 screen) {
  vec3 color=landscape(screen);
  vec2 pixel=gl_FragCoord.xy;
  vec2 touch=(u_pointer+0.5)*u_resolution;
  touch.y=u_resolution.y-touch.y;
  for(int i=0;i<5;i++) {
    vec4 box=u_panels[i];
    vec2 local=pixel-box.xy;
    float radius=u_radii[i];
    float d=roundedPanel(local,box.zw,radius);
    float shadow=exp(-max(roundedPanel(local+vec2(0.0,9.0)*u_scale,box.zw,radius),0.0)/(14.0*u_scale));
    color*=1.0-shadow*0.19*smoothstep(-1.0,2.0,d);
    if(d<1.5) {
      float bevel=(12.0+u_value*20.0)*u_scale;
      float edge=1.0-smoothstep(0.0,bevel,-d);
      vec2 q=abs(local)-box.zw+radius;
      vec2 normal=normalize(max(q,vec2(0.001)))*sign(local);
      if(q.x<0.0) normal=vec2(0.0,sign(local.y));
      if(q.y<0.0) normal=vec2(sign(local.x),0.0);
      vec2 distortion=-normal*pow(edge,1.4)*(8.0+u_value*28.0)*u_scale;
      distortion-=local*(0.008+u_value*0.024);
      vec2 refracted=screen+distortion/u_resolution;
      float blur=(u_variant==1?5.5:1.0)*u_scale;
      vec2 spread=vec2(blur)/u_resolution;
      vec3 inside=(landscape(refracted+spread*vec2(1,0))+landscape(refracted-spread*vec2(1,0))+landscape(refracted+spread*vec2(0,1))+landscape(refracted-spread*vec2(0,1)))*0.25;
      float chromatic=edge*u_value*1.3*u_scale;
      inside.r=mix(inside.r,landscape(refracted+normal*chromatic/u_resolution).r,0.55);
      inside.b=mix(inside.b,landscape(refracted-normal*chromatic/u_resolution).b,0.55);
      inside=mix(inside,vec3(0.74,0.85,0.88),u_variant==1?0.16:0.055);
      inside*=u_variant==2?0.62:0.89;
      float rim=exp(-abs(d+1.3*u_scale)/(1.0*u_scale));
      float highlight=0.15+0.85*pow(max(dot(normal,normalize(vec2(-0.55,0.85))),0.0),3.0);
      float fingertip=exp(-length(pixel-touch)/(125.0*u_scale));
      inside+=vec3(1.0,0.95,0.84)*rim*(highlight*0.48+fingertip*0.38);
      inside+=vec3(0.55,0.75,0.9)*pow(edge,4.0)*0.09;
      inside+=vec3(0.4,0.55,0.7)*fingertip*edge*0.08;
      color=mix(color,inside,1.0-smoothstep(-1.0,1.0,d));
    }
  }
  return color;
}
void main() {
  vec2 screen=gl_FragCoord.xy/u_resolution;
  vec2 uv=(screen-u_center)*vec2(u_resolution.x/u_resolution.y,1.0)*2.0;
  uv*=mix(1.0,1.58,u_mobile);
  vec3 color;
  if(u_mode==0) color=planet(uv,screen);
  else if(u_mode==3) color=tunnel(uv);
  else if(u_mode==5) color=liquidGlass(screen);
  else color=objectScene(uv);
  color=pow(max(color,vec3(0.0)),vec3(0.91));
  float grain=(hash(vec3(gl_FragCoord.xy,1.0))-0.5)/255.0;
  gl_FragColor=vec4(color+grain,1.0);
}`;

function compile(kind, source) {
  const shader = gl.createShader(kind);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function initializeGPU() {
  try {
    gl = gpu.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL is not available.');
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    locations = Object.fromEntries(['resolution','center','pointer','time','value','focus','pulse','mobile','mode','variant','scale','brightness','light_scene'].map((name) => [name, gl.getUniformLocation(program, 'u_' + name)]));
    locations.panels = gl.getUniformLocation(program,'u_panels[0]');
    locations.radii = gl.getUniformLocation(program,'u_radii[0]');
    rendererError = '';
  } catch (error) {
    rendererError = error.message;
    console.error('Graphics initialization failed: ' + rendererError);
  }
}

const vertices = [];
const edges = [];
for (let z = 0; z < 5; z++) for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
  const index = vertices.length;
  vertices.push([(x - 2) * 0.48, (y - 2) * 0.48, (z - 2) * 0.48]);
  if (x < 4) edges.push([index, index + 1]);
  if (y < 4) edges.push([index, index + 5]);
  if (z < 4) edges.push([index, index + 25]);
}

function renderNetwork() {
  const ratio = network.width / width;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = '#06100c'; ctx.fillRect(0, 0, width, height);
  const mobile = width < 680;
  const center = [width * (mobile ? 0.5 : 0.68), height * (mobile ? 0.55 : 0.47)];
  const radius = mobile ? width * 0.24 : Math.min(width * 0.19, height * 0.31);
  const color = [[174,246,182],[186,161,255],[255,201,127]][state.variant];
  const rgb = color.join(',');
  const glow = ctx.createRadialGradient(...center, 0, ...center, radius * 2);
  glow.addColorStop(0, `rgba(${rgb},0.085)`); glow.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.translate(center[0],center[1]+radius*1.5); ctx.scale(1,0.23);
  for (let ring=0;ring<4;ring++) {
    ctx.strokeStyle = `rgba(${rgb},${0.085-ring*0.015})`; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(0,0,radius*(0.95+ring*0.15),0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = `rgba(${rgb},0.035)`; ctx.lineWidth = 0.5;
  for (let x = 0; x < width; x += 36) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
  for (let y = 0; y < height; y += 36) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
  const angle = state.time * 0.13 + 0.5 + state.pointer[0] * 0.65;
  const tilt = 0.38 + state.pointer[1] * 0.35;
  const points = vertices.map(([x,y,z], index) => {
    const bend = Math.sin(state.time * 0.7 + index * 0.31) * 0.05;
    const xx = x * Math.cos(angle) + z * Math.sin(angle);
    const zz = z * Math.cos(angle) - x * Math.sin(angle);
    const yy = (y + bend) * Math.cos(tilt) - zz * Math.sin(tilt);
    const depth = zz * Math.cos(tilt) + y * Math.sin(tilt);
    const scale = 3.6 / (3.6 + depth);
    return { x: center[0] + xx * radius * scale, y: center[1] + yy * radius * scale, depth, scale, index };
  });
  let active = 0;
  edges.forEach(([a,b], index) => {
    if (((index * 73) % 301) / 301 > 0.12 + state.value / 100 * 0.88) return;
    active++;
    const p = points[a], q = points[b];
    const alpha = Math.min(0.65, 0.12 + (2 - p.depth) * 0.065 + state.pulse * 0.30);
    ctx.strokeStyle = `rgba(${rgb},${alpha*0.10})`; ctx.lineWidth = 4*p.scale;
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
    ctx.strokeStyle = `rgba(${rgb},${alpha})`; ctx.lineWidth = 0.65*p.scale + state.pulse * 0.65;
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
    if (state.pulse > 0.05 || index%11===0) {
      const t = (state.time * (state.pulse>0.05?1.8:0.27) + index * 0.19) % 1;
      const tail = Math.max(0,t-0.11);
      ctx.strokeStyle = `rgba(235,255,244,${0.4+state.pulse*0.6})`; ctx.lineWidth = p.scale*1.4;
      ctx.beginPath(); ctx.moveTo(p.x+(q.x-p.x)*tail,p.y+(q.y-p.y)*tail); ctx.lineTo(p.x+(q.x-p.x)*t,p.y+(q.y-p.y)*t); ctx.stroke();
    }
  });
  points.sort((a,b) => b.depth - a.depth).forEach((p) => {
    const size = 1.1 + p.scale * 1.45;
    const bright = p.index % 7 === 0;
    if (bright) {
      const halo = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,size * 6);
      halo.addColorStop(0, `rgba(${rgb},0.5)`); halo.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = halo; ctx.fillRect(p.x-size*6,p.y-size*6,size*12,size*12);
    }
    const shell=ctx.createRadialGradient(p.x-size*.35,p.y-size*.4,0,p.x,p.y,size);
    shell.addColorStop(0,'#ecfff4'); shell.addColorStop(0.3,`rgba(${rgb},0.95)`); shell.addColorStop(1,'#102b24');
    ctx.fillStyle = shell;
    ctx.beginPath(); ctx.arc(p.x,p.y,size,0,Math.PI*2); ctx.fill();
    if(bright) { ctx.strokeStyle=`rgba(${rgb},0.3)`; ctx.lineWidth=0.6; ctx.beginPath(); ctx.arc(p.x,p.y,size*2.2,0,Math.PI*2); ctx.stroke(); }
    if (bright && !mobile) { ctx.font = '7px monospace'; ctx.fillStyle = `rgba(${rgb},0.5)`; ctx.fillText(p.index.toString(16).padStart(2,'0').toUpperCase(),p.x+7,p.y-6); }
  });
  $('#readout').textContent = String(active).padStart(3,'0') + ' / 300';
}

function render() {
  if (state.name === 'synapse') { renderNetwork(); return; }
  if (rendererError || !gl || gl.isContextLost()) return;
  const mobile = width < 680;
  gl.viewport(0,0,gpu.width,gpu.height);
  gl.uniform2f(locations.resolution,gpu.width,gpu.height);
  gl.uniform2f(locations.center,state.focused ? 0.5 : mobile ? 0.5 : 0.69,mobile ? 0.41 : 0.53);
  gl.uniform2f(locations.pointer,...state.pointer);
  gl.uniform1f(locations.time,state.time);
  gl.uniform1f(locations.value,state.value / 100);
  gl.uniform1f(locations.focus,state.focused ? 1 : 0);
  gl.uniform1f(locations.pulse,state.pulse);
  gl.uniform1f(locations.mobile,mobile ? 1 : 0);
  gl.uniform1i(locations.mode,worlds[state.name].mode);
  gl.uniform1i(locations.variant,state.variant);
  if(state.name==='lucent') {
    const bounds=$('#experience').getBoundingClientRect();
    const ratio=gpu.width/width;
    glassPanes.forEach((pane,index) => {
      const rect=pane.getBoundingClientRect();
      glassRects.set([(rect.left-bounds.left+rect.width/2)*ratio,(height-(rect.top-bounds.top+rect.height/2))*ratio,rect.width*ratio/2,rect.height*ratio/2],index*4);
      glassRadii[index]=parseFloat(getComputedStyle(pane).borderTopLeftRadius)*ratio;
    });
    gl.uniform4fv(locations.panels,glassRects);
    gl.uniform1fv(locations.radii,glassRadii);
    gl.uniform1f(locations.scale,ratio);
    gl.uniform1f(locations.brightness,state.brightness);
    gl.uniform1i(locations.light_scene,state.lightScene);
  }
  gl.drawArrays(gl.TRIANGLES,0,3);
}

function resize() {
  const bounds = $('#experience').getBoundingClientRect();
  width = Math.round(bounds.width); height = Math.round(bounds.height);
  const ratio = Math.min(devicePixelRatio || 1,1.5,Math.sqrt((width<680?650000:1400000) / (width * height)));
  for (const canvas of [gpu,network]) {
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  $('#resolution').textContent = gpu.width + ' × ' + gpu.height;
  render();
}

function updateReadout() {
  const world = worlds[state.name];
  $('#parameter-value').value = state.value + '%';
  if (world.mode === 0) $('#readout').textContent = Math.round(state.value * 1.8) + '°';
  else if (world.mode !== 2) $('#readout').textContent = (state.value / 100).toFixed(2) + (world.mode === 4 ? ' / SPECTRUM' : ' / 1.00');
}

function selectWorld() {
  const key = location.hash.slice(1);
  state.name = Object.hasOwn(worlds,key) ? key : 'orbis';
  const world = worlds[state.name];
  state.value = world.value; state.variant = 0; state.focused = false; state.pulse = 0; state.pointer = [0,0];
  document.body.dataset.world = state.name;
  document.title = state.name.toUpperCase() + ' / Future Studies';
  $('#experience').classList.remove('inspecting');
  $('#category').textContent = String(world.mode+1).padStart(2,'0') + ' / ' + world.category;
  $('#eyebrow').textContent = world.eyebrow;
  $('#world-title').innerHTML = world.title;
  $('#description').innerHTML = world.description;
  $('#world-caption').innerHTML = state.name.toUpperCase() + '<br><b>' + world.caption + '</b>';
  $('#world-number').textContent = String(world.mode+1).padStart(3,'0');
  $('#object-label').textContent = world.object;
  $('#instrument-label').textContent = world.instrument;
  $('#action-label').textContent = world.action;
  $('#parameter-label').textContent = world.parameter;
  $('#readout-label').textContent = world.readout;
  $('#parameter').value = state.value;
  $('#renderer-label').textContent = world.mode === 2 ? '3D → CANVAS 2D' : 'WEBGL / GLSL';
  $('#network').hidden = world.mode !== 2;
  $('#gpu').hidden = world.mode === 2;
  $('#glass-interface').hidden = world.mode !== 5;
  $('#gesture-hint').textContent = world.mode===5 ? 'TOUCH THE EDGES · CHANGE THE LIGHT · FEEL THE DEPTH' : 'MOVE OR DRAG TO CHANGE PERSPECTIVE';
  $('#unavailable').hidden = !rendererError || world.mode === 2;
  $$('[data-variant]').forEach((button,index) => { button.textContent = world.variants[index]; button.setAttribute('aria-pressed',String(index === 0)); });
  $$('.world-nav a').forEach((link) => { if (link.hash === '#' + state.name) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
  updateReadout(); resize(); schedule();
}

function updateMotion() {
  $('#motion').setAttribute('aria-pressed',String(state.paused));
  $('#motion-label').textContent = state.paused ? 'Resume motion' : 'Pause motion';
  $('#glass-motion').setAttribute('aria-pressed',String(state.paused));
  $('#glass-motion-label').textContent=state.paused?'Still':'Flowing';
}

function schedule() {
  cancelAnimationFrame(request); request = 0; previous = 0;
  if (!state.paused && !document.hidden) request = requestAnimationFrame(tick);
}

function tick(timestamp) {
  if (!previous) previous = timestamp;
  const elapsed = (timestamp - previous) / 1000;
  if (elapsed >= 1 / 30) {
    const dt = Math.min(elapsed,0.1);
    state.time += dt; state.pulse = Math.max(0,state.pulse-dt*0.32);
    previous = timestamp; render();
  }
  if (!state.paused && !document.hidden) request = requestAnimationFrame(tick);
}

$('#parameter').addEventListener('input',(event) => { state.value = Number(event.target.value); updateReadout(); render(); });
$$('[data-variant]').forEach((button) => button.addEventListener('click',() => {
  state.variant = Number(button.dataset.variant);
  $$('[data-variant]').forEach((item) => item.setAttribute('aria-pressed',String(item === button)));
  render();
}));
$('#action').addEventListener('click',() => {
  if (state.name === 'synapse' || state.name === 'velocity') {
    state.pulse = 1; state.time += state.name === 'velocity' ? 2.1 : 0.2;
    $('#action-label').textContent = state.name === 'synapse' ? 'Signal sent · fire again' : 'Jump again';
  } else {
    state.focused = !state.focused;
    $('#experience').classList.toggle('inspecting',state.focused);
    $('#action-label').textContent = state.focused ? 'Back to the study' : worlds[state.name].action;
  }
  render();
});
$('#motion').addEventListener('click',() => { state.paused = !state.paused; updateMotion(); schedule(); });
$('#glass-motion').addEventListener('click',() => { state.paused = !state.paused; updateMotion(); schedule(); });
$('#glass-light').addEventListener('input',(event) => {
  state.brightness=Number(event.target.value)/100;
  $('#glass-light-value').value=event.target.value+'%'; render();
});
$$('[data-light-scene]').forEach((button)=>button.addEventListener('click',()=>{
  state.lightScene=Number(button.dataset.lightScene);
  const scenes=[['Morning<br>light.','Nothing to finish. A little room to breathe.','01 / SUNLIT DUNES'],['The blue<br>hour.','Let the day soften around the edges.','02 / LAST LIGHT'],['After<br>hours.','A quieter world. A different perspective.','03 / MOONLIT COAST']];
  const scene=scenes[state.lightScene];
  $('#glass-title').innerHTML=scene[0]; $('#glass-caption').textContent=scene[1]; $('#glass-scene-label').textContent=scene[2];
  $$('[data-light-scene]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));
  render();
}));
$('#experience').addEventListener('pointermove',(event) => {
  if (event.target.closest('button,input,a,.interaction-dock') && !event.target.closest('#glass-interface')) return;
  if (event.pointerType === 'touch' && !event.buttons) return;
  const bounds = $('#experience').getBoundingClientRect();
  state.pointer = [(event.clientX-bounds.left)/width-0.5,(event.clientY-bounds.top)/height-0.5];
  if (state.paused) render();
});
$('#experience').addEventListener('pointerdown',(event) => {
  if (event.target.closest('button,input,a,.interaction-dock') && !event.target.closest('#glass-interface')) return;
  const bounds = $('#experience').getBoundingClientRect();
  state.pointer = [(event.clientX-bounds.left)/width-0.5,(event.clientY-bounds.top)/height-0.5];
  render();
});
media.addEventListener('change',() => { if (media.matches) state.paused = true; updateMotion(); schedule(); });
document.addEventListener('visibilitychange',schedule);
addEventListener('resize',resize);
addEventListener('hashchange',selectWorld);
gpu.addEventListener('webglcontextlost',(event) => { event.preventDefault(); rendererError = 'The GPU context was interrupted.'; if (state.name !== 'synapse') $('#unavailable').hidden = false; });
gpu.addEventListener('webglcontextrestored',() => { initializeGPU(); $('#unavailable').hidden = !rendererError || state.name === 'synapse'; resize(); });
initializeGPU(); updateMotion(); selectWorld();
