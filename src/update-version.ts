function parseSemver(value:string):number[]|null{
  const clean=value.trim().replace(/^v/i,'').split('-')[0];
  const parts=clean.split('.');
  if(parts.length<2||parts.length>4||parts.some(part=>!/^\d+$/.test(part)))return null;
  return parts.map(Number);
}

export function compareVersions(left:string,right:string):number{
  const a=parseSemver(left),b=parseSemver(right);
  if(!a||!b)return left.localeCompare(right,undefined,{numeric:true,sensitivity:'base'});
  for(let i=0;i<Math.max(a.length,b.length);i++){
    const diff=(a[i]??0)-(b[i]??0);
    if(diff!==0)return diff<0?-1:1;
  }
  return 0;
}
