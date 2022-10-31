import make from "./make.js";
import scriptLoader from "../inserts/demo/scriptLoader.js";
import { createId } from "./ModelUtil.js";

const styleLoader = () => {
  const template = document.querySelector("#__imported_style_map");
  const styles = JSON.parse(template.textContent);
  class StyleLoader extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback(){
      const style = document.createElement("style");
      const href = this.getAttribute("href");
      style.innerHTML = styles[href]||"";
      this.before(style);
      this.remove();
    }
  }
  customElements.define("style-loader", StyleLoader);
}
const webStorageWrapper = () => {
  const storageContext = JSON.parse(document.querySelector("#__local_storage_backup").textContent);
  const createStorage = (data, { set=()=>{}, clear=()=>{}, remove=()=>{} }={}) => {
    const storage = new Map(data);
    return Object.assign(Object.create(null), {
      key:n=>[...storage.keys()][n],
      getItem:name=>storage.get(name),
      setItem:(name, value)=>{
        storage.set(name,value+"");
        set(name, value);
      },
      removeItem:(key)=>{
        storage.delete(key);
        remove(key);
      },
      clear:()=>{
        storage.clear();
        clear();
      },
    });
  }
  Object.defineProperty(window, "sessionStorage", {
    value:createStorage(),
  });
  const sendMessage = (detail) => {
    parent.postMessage({action:"localStorage", project:storageContext.project, detail}, "*");
  }
  Object.defineProperty(window, "localStorage", {
    value:createStorage(storageContext.data, {
      set(name, value){
        sendMessage({action:"set", args:[name, value]});
      },
      remove(name){
        sendMessage({action:"remove", args:[name]});
      },
      clear(){
        sendMessage({action:"clear", args:[]});
      }
    }),
  });
}

const createScriptElem = (content, type="text/javascript") => {
  return make("script", {textContent:content, type});
}
const getFuncContents = func => {
  const str = func + "";
  const funcContentStr = str.replace(/^[^{]*{/, "").replace(/}[^}]*$/, "");
  return funcContentStr;
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

const generateDemoPage = async (project) => {
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

  const scripts = [
    makeJSONImport(
      "__imported_style_map",
      JSON.stringify(
        project
          .findFilesByLanguage("css")
          .reduce(
            (o,{path,file})=>
              Object.assign(o,{[path]:file.stringValue}),
            {}
          )
      )
    ),
    createScriptElem(`(()=>{${getFuncContents(styleLoader)}})()`),
    makeJSONImport(
      "__local_storage_backup",
      JSON.stringify({project:project.id, data:project.localStorage})
    ),
    createScriptElem(`(()=>{${getFuncContents(webStorageWrapper)}})()`),
  ];

  injectScripts(project, scripts, scriptLoader);
  
  if(importMapScript){
    scripts.reverse().forEach(e=>importMapScript.after(e));
  }
  else{
    scripts.forEach(e=>dom.body.append(e));
  }
  return dom.documentElement.innerHTML;
}

export default generateDemoPage;