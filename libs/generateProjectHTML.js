import make from "./make.js";
import { createId } from "./ModelUtil.js";
import scriptLoader from "../inserts/demo/scriptLoader.js";
import styleLoader from "../inserts/demo/styleLoader.js";

const injections = [scriptLoader, styleLoader];

const createScriptElem = (content, type="text/javascript") => {
  return make("script", {textContent:content, type});
}

const file2DataUri = (fileName, value) => new Promise(resolve=>{
  const fileReader = new FileReader();
  const file = new File([value], fileName, {
    type: getMimeTypeFromFileName(fileName),
  });
  fileReader.onload = () => {
    const dataUri = fileReader.result;
    resolve(dataUri);
  }
  fileReader.readAsDataURL(file);
});

const makeJSONImport = (id, textContent) => make("script", {
  type:"text/json",
  id,
  textContent,
});

const injectScripts = (project, scripts, {insertData, onProcess}) => {
  if(!insertData){
    scripts.push(createScriptElem(`(${onProcess+""})()`));
    return;
  }
  //idは１文字目を数字にできないので _を付ける
  const injectionId = "_"+createId();
  scripts.push(makeJSONImport(injectionId, JSON.stringify(insertData(project))));
  scripts.push(createScriptElem(`(${onProcess+""})(JSON.parse(document.querySelector(\`#${injectionId}\`).textContent))`));
}

const generateProjectHTML = async (project) => {
  const entryFile = project.findFileById(project.entryFile);
  const dom = new DOMParser().parseFromString(entryFile.stringValue, "text/html");
  
  if(!dom.querySelector(`script[type="importmap"]`)){
    dom.head.insertBefore(make("script", {type:"importmap"}), dom.head.firstChild);
  }
  const importMapScript = [...dom.querySelectorAll(`script[type="importmap"]`)].pop();
  const importsMap = JSON.parse(importMapScript.textContent||JSON.stringify({"imports":{}}));
  const scriptFiles = project.findFilesByLanguage("javascript");
  const dataUris = await Promise.all(scriptFiles.map(({path,file}) => file2DataUri(file.name, file.stringValue).then(data=>({path,data}))));
  dataUris.forEach(({path, data})=>{
    importsMap.imports[path] = data;
  });

  importMapScript.textContent = JSON.stringify(importsMap);

  const scripts = [];

  injections.forEach(injection=>injectScripts(project, scripts, injection));
  
  if(importMapScript){
    scripts.reverse().forEach(e=>importMapScript.after(e));
  }
  else{
    scripts.forEach(e=>dom.body.append(e));
  }
  return dom.documentElement.innerHTML;
}

export default generateProjectHTML;