import{t as e}from"./arc-DpPE_Lbv.js";import{An as t,Dn as n,Fn as r,Jn as i,Jt as a,Ln as o,Mn as s,P as c,Pn as l,Pt as u,Rn as d,Xn as f,Yt as p,jt as m,k as h,or as g,pn as _,qn as v,sr as y}from"./index-9lz8qPZK.js";import"./chunk-FPAJGGOC-BXsFsqDU.js";import"./reduce-BdquLzYy.js";import"./flatten-CVYamRPM.js";import"./chunk-O7ZBX7Z2-SuKN_y20.js";import"./chunk-S6J4BHB3--0_k09YS.js";import"./chunk-LBM3YZW2-2v3pMxPt.js";import"./chunk-76Q3JFCE-BkwjrIpe.js";import"./chunk-T53DSG4Q-BXdEA3J_.js";import"./chunk-LHMN2FUI-DCmi_QqK.js";import"./chunk-FWNWRKHM-Da5HFxmI.js";import{t as b}from"./chunk-4BX2VUAB-DYtC3U9x.js";import{t as x}from"./mermaid-parser.core-CWNWvzZ-.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,r=p(0),i=p(a),o=p(0);function s(s){var c,l=(s=u(s)).length,d,f,p=0,m=Array(l),h=Array(l),g=+r.apply(this,arguments),_=Math.min(a,Math.max(-a,i.apply(this,arguments)-g)),v,y=Math.min(Math.abs(_)/l,o.apply(this,arguments)),b=y*(_<0?-1:1),x;for(c=0;c<l;++c)(x=h[m[c]=c]=+e(s[c],c,s))>0&&(p+=x);for(t==null?n!=null&&m.sort(function(e,t){return n(s[e],s[t])}):m.sort(function(e,n){return t(h[e],h[n])}),c=0,f=p?(_-l*b)/p:0;c<l;++c,g=v)d=m[c],x=h[d],v=g+(x>0?x*f:0)+b,h[d]={data:s[d],index:c,value:x,startAngle:g,endAngle:v,padAngle:y};return h}return s.value=function(t){return arguments.length?(e=typeof t==`function`?t:p(+t),s):e},s.sortValues=function(e){return arguments.length?(t=e,n=null,s):t},s.sort=function(e){return arguments.length?(n=e,t=null,s):n},s.startAngle=function(e){return arguments.length?(r=typeof e==`function`?e:p(+e),s):r},s.endAngle=function(e){return arguments.length?(i=typeof e==`function`?e:p(+e),s):i},s.padAngle=function(e){return arguments.length?(o=typeof e==`function`?e:p(+e),s):o},s}var T=s.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:g(()=>structuredClone(k),`getConfig`),clear:g(()=>{D=new Map,O=E.showData,n()},`clear`),setDiagramTitle:f,getDiagramTitle:d,setAccTitle:i,getAccTitle:r,setAccDescription:v,getAccDescription:l,addSection:g(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),y.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:g(()=>D,`getSections`),setShowData:g(e=>{O=e},`setShowData`),getShowData:g(()=>O,`getShowData`)},j=g((e,t)=>{b(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:g(async e=>{let t=await x(`pie`,e);y.debug(t),j(t,A)},`parse`)},N=g(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=g(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1).sort((e,t)=>t.value-e.value);return w().value(e=>e.value)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:g((n,r,i,a)=>{y.debug(`rendering pie chart
`+n);let s=a.db,l=o(),u=h(s.getConfig(),l.pie),d=m(r),f=d.append(`g`);f.attr(`transform`,`translate(225,225)`);let{themeVariables:p}=l,[g]=c(p.pieOuterStrokeWidth);g??=2;let v=u.textPosition,b=e().innerRadius(0).outerRadius(185),x=e().innerRadius(185*v).outerRadius(185*v);f.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+g/2).attr(`class`,`pieOuterCircle`);let S=s.getSections(),C=P(S),w=[p.pie1,p.pie2,p.pie3,p.pie4,p.pie5,p.pie6,p.pie7,p.pie8,p.pie9,p.pie10,p.pie11,p.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=_(w);f.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),f.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`),f.append(`text`).text(s.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`);let O=[...S.entries()].map(([e,t])=>({label:e,value:t})),k=f.selectAll(`.legend`).data(O).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*O.length/2;return`translate(216,`+(t*22-n)+`)`});k.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),k.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>s.getShowData()?`${e.label} [${e.value}]`:e.label);let A=512+Math.max(...k.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0));d.attr(`viewBox`,`0 0 ${A} 450`),t(d,450,A,u.useMaxWidth)},`draw`)},styles:N};export{F as diagram};