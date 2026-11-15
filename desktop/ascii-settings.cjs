function normalize(value={}) {
  const v=value&&typeof value==='object'?value:{};
  const clamp=(key,min,max,fallback)=>Number.isFinite(v[key])?Math.min(max,Math.max(min,v[key])):fallback;
  return {motion:v.motion==='smooth'?'smooth':'grid',speed:clamp('speed',.1,16,4),cell:[14,18,22].includes(v.cell)?v.cell:14,veil:clamp('veil',0,1,.4)};
}
module.exports={normalize};
