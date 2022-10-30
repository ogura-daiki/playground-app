
const getExt = fileName => /\.[\S]+/.exec(fileName)?.at(0);
const removeExt = fileName => {
  const ext = getExt(fileName)??"";
  if(!ext) return fileName;
  return fileName.slice(0, -ext.length);
}
const getNoSuffixName = name => name.replace(/\s-\d+$/,"");
const incrementFileNameSuffix = (targetName, names, hasExt=false) => {
  const ext = hasExt?(getExt(targetName)??""):"";
  const noSuffixName = getNoSuffixName(hasExt?removeExt(targetName):targetName);
  const maxSuffix = names.reduce((c,name)=>{
    if(name.startsWith(noSuffixName)){
      const extRemoved = hasExt?removeExt(name):name;
      const suffixPart = extRemoved.slice(noSuffixName.length);
      if(/-(\d+)$/.test(suffixPart)){
        const suffix = /-(\d+)$/.exec(suffixPart)?.at(1);
        c.push(+suffix);
      }
    }
    return c;
  },[0]).sort().pop();
  return `${noSuffixName} -${maxSuffix+1}${ext}`;
}

export {incrementFileNameSuffix};