import {LEVELS,PIECES,dirs,key,cellName,openings,type Tile,type Piece,type Color} from './levels.ts';
export interface Profile{unlocked:number;stars:number[];theme:number;skin:number}
export const freshProfile=():Profile=>({unlocked:0,stars:Array(9).fill(0),theme:0,skin:0});
export function sanitize(value:unknown):Profile{const p=freshProfile();if(!value||typeof value!=='object')return p;const v=value as Partial<Profile>;p.unlocked=Number.isFinite(v.unlocked)?Math.max(0,Math.min(8,Math.floor(v.unlocked!))):0;if(Array.isArray(v.stars))p.stars=Array.from({length:9},(_,i)=>Number.isFinite(v.stars![i])?Math.max(0,Math.min(3,Math.floor(v.stars![i]))):0);p.theme=Number.isInteger(v.theme)&&v.theme!>=0&&v.theme!<=Math.floor(p.unlocked/3)?Math.min(2,v.theme!):0;const stars=p.stars.reduce((a,b)=>a+b,0);p.skin=Number.isInteger(v.skin)&&v.skin!>=0&&v.skin!<3&&(v.skin===0||stars>=(v.skin===1?6:15))?v.skin!:0;return p;}
export interface Pos{x:number;y:number;z:number}
export interface Marble{id:number;color:Color;cell:string;entry:number;exit:number;t:number;state:'scheduled'|'moving'|'waiting'|'queued'|'jumping'|'falling'|'caught';at:number;position:Pos;previous:Pos;from:Pos;to:Pos;next:{x:number;z:number;entry:number}|null;triggered:boolean;reason:string}
export interface Event{type:'place'|'rotate'|'launch'|'bounce'|'magnet'|'switch'|'gate'|'seesaw'|'catch'|'fall'|'win'|'fail';cell?:string;color?:Color;amount?:number}
export class Puzzle{
 level:number;board=new Map<string,Tile>();phase:'build'|'running'|'paused'|'won'|'failed'='build';balls:Marble[]=[];events:Event[]=[];time=0;collected=0;hints=0;runs=0;stars=0;message='';revision=0;gates=new Set<string>();flips=new Map<string,number>();pulses=new Map<string,number>();lastExit=new Map<string,number>();history:Array<Map<string,Tile>>=[];stalled=0;
 constructor(level=0){if(!Number.isInteger(level)||level<0||level>=LEVELS.length)throw new RangeError('Unknown table');this.level=level;for(const c of this.config.fixed)this.board.set(key(c.x,c.z),{...c,fixed:true});}
 get config(){return LEVELS[this.level];}
 get total(){return this.config.fixed.reduce((n,t)=>n+(t.colors?.length??0),0);}
 get used(){return [...this.board.values()].filter(t=>!t.fixed).length;}
 remaining(kind:Piece){return (this.config.stock[kind]??0)-[...this.board.values()].filter(t=>!t.fixed&&t.kind===kind).length;}
 remember(){this.history.push(new Map([...this.board].map(([k,t])=>[k,{...t}])));if(this.history.length>40)this.history.shift();}
 editable(){return this.phase==='build'||this.phase==='paused'||this.phase==='failed'||this.phase==='won';}
 editReady(){if(this.phase!=='build')this.retry();}
 place(x:number,z:number,kind:Piece,rot:number){if(!this.editable()||x<0||x>5||z<0||z>5||!Number.isInteger(x)||!Number.isInteger(z)||this.board.get(key(x,z))?.fixed||!this.config.stock[kind])return false;const old=this.board.get(key(x,z));if(this.remaining(kind)<=0&&old?.kind!==kind)return false;this.editReady();this.remember();this.board.set(key(x,z),{kind,rot:((rot%4)+4)%4});this.revision++;this.events.push({type:'place',cell:key(x,z)});return true;}
 rotate(x:number,z:number){const t=this.board.get(key(x,z));if(!t||t.fixed||!this.editable())return false;this.editReady();this.remember();t.rot=(t.rot+1)%4;this.revision++;this.events.push({type:'rotate',cell:key(x,z)});return true;}
 erase(x:number,z:number){const t=this.board.get(key(x,z));if(!t||t.fixed||!this.editable())return false;this.editReady();this.remember();this.board.delete(key(x,z));this.revision++;return true;}
 undo(){if(!this.editable()||!this.history.length)return false;this.editReady();this.board=this.history.pop()!;this.revision++;return true;}
 clear(){if(!this.editable())return false;this.editReady();this.remember();for(const[k,t]of this.board)if(!t.fixed)this.board.delete(k);this.revision++;return true;}
 retry(){this.phase='build';this.balls=[];this.gates.clear();this.flips.clear();this.pulses.clear();this.lastExit.clear();this.time=0;this.collected=0;this.stalled=0;this.message='';this.stars=0;this.events=[];}
 hint(){this.hints++;const c=this.config.solution.find(c=>{const t=this.board.get(key(c.x,c.z));return !t||t.kind!==c.kind||t.rot!==c.rot;});return c?{...c,text:`Try a ${PIECES[c.kind as Piece].name.toLowerCase()} at ${cellName(c.x,c.z)}. ${c.kind==='straight'?c.rot%2?'Connect left and right.':'Connect top and bottom.':c.kind==='bend'?`Openings: ${openings(c).map(d=>['top','right','bottom','left'][d]).join(' + ')}.`:`Point the arrow ${['up','right','down','left'][c.rot]}.`}`}:{text:'Your main route is ready. Extra pieces are optional; press Roll to try it.'};}
 start(){if(this.phase==='paused'){this.phase='running';return true;}if(this.phase!=='build')return false;this.retry();this.phase='running';this.runs++;let id=1;for(const c of this.config.fixed)if(c.kind==='source')for(const [i,color]of c.colors!.entries()){const p={x:c.x,y:.17,z:c.z};this.balls.push({id:id++,color,cell:key(c.x,c.z),entry:-1,exit:c.rot,t:0,state:'scheduled',at:i*2.3,position:{...p},previous:{...p},from:{...p},to:{...p},next:null,triggered:false,reason:''});}this.events.push({type:'launch'});return true;}
 pause(){if(this.phase==='running'){this.phase='paused';return true;}return false;}
 occupied(cell:string,except:number){return this.balls.some(b=>b.id!==except&&b.cell===cell&&!['scheduled','caught','falling','jumping'].includes(b.state));}
 failBall(b:Marble,reason:string){b.state='falling';b.t=0;b.from={...b.position};b.reason=reason;this.message=reason;this.events.push({type:'fall',cell:b.cell,color:b.color});}
 enter(b:Marble,x:number,z:number,entry:number){b.cell=key(x,z);b.entry=entry;b.t=0;b.triggered=false;const v=dirs[entry];b.position={x:x+v.x*.5,y:.17,z:z+v.z*.5};b.from={...b.position};const tile=this.board.get(b.cell);
  if(x<0||x>5||z<0||z>5||!tile||tile.kind==='hole'){this.failBall(b,'A marble left the track. Connect the next square or use a spring.');return;}
  if(tile.kind==='source'){this.failBall(b,'That path returns to a start. Turn the marble toward its cup.');return;}
  if(tile.kind==='cup'){b.exit=-1;b.state='moving';return;}
  if(tile.kind==='magnet'){if(entry===tile.rot){this.failBall(b,'The marble entered the pointed end of a magnet. Rotate it.');return;}b.exit=tile.rot;}
  else if(tile.kind==='spring'||tile.kind==='seesaw'){if(entry!==(tile.rot+2)%4){this.failBall(b,`Enter the ${tile.kind} from behind its arrow.`);return;}if(tile.kind==='seesaw'){const n=this.flips.get(b.cell)||0;b.exit=(tile.rot+(n%2?3:1))%4;this.flips.set(b.cell,n+1);this.lastExit.set(b.cell,b.exit);this.pulses.set(b.cell,this.time);this.events.push({type:'seesaw',cell:b.cell});}else b.exit=tile.rot;}
  else{const open=openings(tile);if(!open.includes(entry)){this.failBall(b,'Those rail openings do not meet. Rotate the piece and try again.');return;}b.exit=open.find(d=>d!==entry)!;}
  b.state=tile.kind==='gate'&&!this.gates.has(tile.key!)?'waiting':'moving';
 }
 advance(b:Marble){const [x,z]=b.cell.split(',').map(Number),d=dirs[b.exit],nx=x+d.x,nz=z+d.z;if(this.occupied(key(nx,nz),b.id)){b.state='queued';return;}this.enter(b,nx,nz,(b.exit+2)%4);}
 tick(dt:number){if(this.phase!=='running')return;this.time+=dt;let moving=false;
  for(const b of this.balls){b.previous={...b.position};
   if(b.state==='scheduled'){if(this.time>=b.at&&!this.occupied(b.cell,b.id)){b.state='moving';b.t=0;}continue;}
   if(b.state==='caught')continue;
   if(b.state==='falling'){b.t+=dt;b.position={x:b.from.x,y:b.from.y-4*b.t*b.t,z:b.from.z};if(b.t>.7){this.phase='failed';this.events.push({type:'fail'});}continue;}
   if(b.state==='waiting'){const t=this.board.get(b.cell);if(t&&this.gates.has(t.key!)){b.state='moving';this.events.push({type:'gate',cell:b.cell});}continue;}
   if(b.state==='queued'){this.advance(b);continue;}
   moving=true;
   if(b.state==='jumping'){b.t=Math.min(1,b.t+dt/.75);const t=b.t;b.position={x:b.from.x+(b.to.x-b.from.x)*t,y:.17+Math.sin(t*Math.PI)*1.45,z:b.from.z+(b.to.z-b.from.z)*t};if(t>=1){const n=b.next!;if(this.occupied(key(n.x,n.z),b.id))this.failBall(b,'The spring landing was blocked by another marble.');else this.enter(b,n.x,n.z,n.entry);}continue;}
   const tile=this.board.get(b.cell)!,[x,z]=b.cell.split(',').map(Number),duration=tile.kind==='source'?.34:tile.kind==='cup'?.42:.62;b.t=Math.min(1,b.t+dt/duration);
   if(tile.kind==='cup'){b.position={x:b.from.x+(x-b.from.x)*b.t,y:.17-b.t*b.t*.3,z:b.from.z+(z-b.from.z)*b.t};if(b.t>=1){if(tile.color!==b.color){this.failBall(b,'Wrong cup! Match each marble to its own color.');}else{b.state='caught';this.collected++;this.pulses.set(b.cell,this.time);this.events.push({type:'catch',cell:b.cell,color:b.color,amount:this.collected});}}continue;}
   const out=dirs[b.exit],start=tile.kind==='source'?{x,z}:b.from,end={x:x+out.x*.5,z:z+out.z*.5},t=b.t;
   // Rails constrain motion. Curves are smooth quadratic paths through a tile.
   b.position={x:(1-t)*(1-t)*start.x+2*(1-t)*t*x+t*t*end.x,y:.17,z:(1-t)*(1-t)*start.z+2*(1-t)*t*z+t*t*end.z};
   if(tile.kind==='spring'&&t>=.5){b.state='jumping';b.t=0;b.from={x,y:.17,z};const d=dirs[tile.rot];b.to={x:x+d.x*1.5,y:.17,z:z+d.z*1.5};b.next={x:x+d.x*2,z:z+d.z*2,entry:(tile.rot+2)%4};this.pulses.set(b.cell,this.time);this.events.push({type:'bounce',cell:b.cell});continue;}
   if(t>=.5&&!b.triggered){b.triggered=true;if(tile.kind==='switch'){this.gates.add(tile.key!);this.pulses.set(b.cell,this.time);this.events.push({type:'switch',cell:b.cell});}if(tile.kind==='magnet'){this.pulses.set(b.cell,this.time);this.events.push({type:'magnet',cell:b.cell});}}
   if(t>=1)this.advance(b);
  }
  if(this.phase==='failed')return;
  if(this.collected===this.total){this.phase='won';this.stars=1+Number(this.used<=this.config.par)+Number(this.used<=this.config.par&&this.hints===0);this.events.push({type:'win'});return;}
  this.stalled=moving?0:this.stalled+dt;
  if(this.time>40||this.stalled>3&&!this.balls.some(b=>b.state==='scheduled')){this.phase='failed';this.message='The marbles are waiting for a route or a switch. Adjust the layout and try again.';this.events.push({type:'fail'});}
 }
 snapshot(){return {level:this.level+1,phase:this.phase,time:this.time,collected:this.collected,total:this.total,used:this.used,stars:this.stars,gates:[...this.gates],balls:this.balls.map(b=>({color:b.color,state:b.state,cell:b.cell,position:b.position}))};}
}
