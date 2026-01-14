import{An as e,Dn as t,Fn as n,In as r,Jn as i,Mn as a,Pn as o,Rn as s,Xn as c,jt as l,k as u,or as d,qn as f,sr as p}from"./index-9lz8qPZK.js";import"./chunk-FPAJGGOC-BXsFsqDU.js";import"./reduce-BdquLzYy.js";import"./flatten-CVYamRPM.js";import"./chunk-O7ZBX7Z2-SuKN_y20.js";import"./chunk-S6J4BHB3--0_k09YS.js";import"./chunk-LBM3YZW2-2v3pMxPt.js";import"./chunk-76Q3JFCE-BkwjrIpe.js";import"./chunk-T53DSG4Q-BXdEA3J_.js";import"./chunk-LHMN2FUI-DCmi_QqK.js";import"./chunk-FWNWRKHM-Da5HFxmI.js";import{t as m}from"./chunk-4BX2VUAB-DYtC3U9x.js";import{t as h}from"./mermaid-parser.core-CWNWvzZ-.js";var g=a.packet,_=class{constructor(){this.packet=[],this.setAccTitle=i,this.getAccTitle=n,this.setDiagramTitle=c,this.getDiagramTitle=s,this.getAccDescription=o,this.setAccDescription=f}static#e=d(this,`PacketDB`);getConfig(){let e=u({...g,...r().packet});return e.showBits&&(e.paddingY+=10),e}getPacket(){return this.packet}pushWord(e){e.length>0&&this.packet.push(e)}clear(){t(),this.packet=[]}},v=1e4,y=d((e,t)=>{m(e,t);let n=-1,r=[],i=1,{bitsPerRow:a}=t.getConfig();for(let{start:o,end:s,bits:c,label:l}of e.blocks){if(o!==void 0&&s!==void 0&&s<o)throw Error(`Packet block ${o} - ${s} is invalid. End must be greater than start.`);if(o??=n+1,o!==n+1)throw Error(`Packet block ${o} - ${s??o} is not contiguous. It should start from ${n+1}.`);if(c===0)throw Error(`Packet block ${o} is invalid. Cannot have a zero bit field.`);for(s??=o+(c??1)-1,c??=s-o+1,n=s,p.debug(`Packet block ${o} - ${n} with label ${l}`);r.length<=a+1&&t.getPacket().length<v;){let[e,n]=b({start:o,end:s,bits:c,label:l},i,a);if(r.push(e),e.end+1===i*a&&(t.pushWord(r),r=[],i++),!n)break;({start:o,end:s,bits:c,label:l}=n)}}t.pushWord(r)},`populate`),b=d((e,t,n)=>{if(e.start===void 0)throw Error(`start should have been set during first phase`);if(e.end===void 0)throw Error(`end should have been set during first phase`);if(e.start>e.end)throw Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*n)return[e,void 0];let r=t*n-1,i=t*n;return[{start:e.start,end:r,label:e.label,bits:r-e.start},{start:i,end:e.end,label:e.label,bits:e.end-i}]},`getNextFittingBlock`),x={parser:{yy:void 0},parse:d(async e=>{let t=await h(`packet`,e),n=x.parser?.yy;if(!(n instanceof _))throw Error(`parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.`);p.debug(t),y(t,n)},`parse`)},S=d((t,n,r,i)=>{let a=i.db,o=a.getConfig(),{rowHeight:s,paddingY:c,bitWidth:u,bitsPerRow:d}=o,f=a.getPacket(),p=a.getDiagramTitle(),m=s+c,h=m*(f.length+1)-(p?0:s),g=u*d+2,_=l(n);_.attr(`viewbox`,`0 0 ${g} ${h}`),e(_,h,g,o.useMaxWidth);for(let[e,t]of f.entries())C(_,t,e,o);_.append(`text`).text(p).attr(`x`,g/2).attr(`y`,h-m/2).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).attr(`class`,`packetTitle`)},`draw`),C=d((e,t,n,{rowHeight:r,paddingX:i,paddingY:a,bitWidth:o,bitsPerRow:s,showBits:c})=>{let l=e.append(`g`),u=n*(r+a)+a;for(let e of t){let t=e.start%s*o+1,n=(e.end-e.start+1)*o-i;if(l.append(`rect`).attr(`x`,t).attr(`y`,u).attr(`width`,n).attr(`height`,r).attr(`class`,`packetBlock`),l.append(`text`).attr(`x`,t+n/2).attr(`y`,u+r/2).attr(`class`,`packetLabel`).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).text(e.label),!c)continue;let a=e.end===e.start,d=u-2;l.append(`text`).attr(`x`,t+(a?n/2:0)).attr(`y`,d).attr(`class`,`packetByte start`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,a?`middle`:`start`).text(e.start),a||l.append(`text`).attr(`x`,t+n).attr(`y`,d).attr(`class`,`packetByte end`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,`end`).text(e.end)}},`drawWord`),w={draw:S},T={byteFontSize:`10px`,startByteColor:`black`,endByteColor:`black`,labelColor:`black`,labelFontSize:`12px`,titleColor:`black`,titleFontSize:`14px`,blockStrokeColor:`black`,blockStrokeWidth:`1`,blockFillColor:`#efefef`},E={parser:x,get db(){return new _},renderer:w,styles:d(({packet:e}={})=>{let t=u(T,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},`styles`)};export{E as diagram};