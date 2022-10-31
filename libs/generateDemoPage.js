import make from "./make.js";

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
const scriptLoader = () => {
  const template = document.querySelector("#__imported_script_map");
  const scripts = JSON.parse(template.textContent);
  class ScriptLoader extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback(){
      const scriptElem = document.createElement("script");
      this.before(scriptElem);
      this.remove();
      scriptElem.type = this.getAttribute("type")||"text/javascript";
      scriptElem.textContent = scripts[this.getAttribute("src")];
    }
  }
  customElements.define("script-loader", ScriptLoader);
}
const webStorageWrapper = () => {
  const backup = JSON.parse(document.querySelector("#__local_storage_backup").textContent);
  const createStorage = (data, { set=()=>{}, clear=()=>{} }={}) => {
    const storage = new Map(data);
    return Object.assign(Object.create(null), {
      key:n=>[...storage.keys()][n],
      getItem:name=>storage.get(name),
      setItem:(name, value)=>{
        storage.set(name,value+"");
        set(name, value);
      },
      removeItem:(key)=>void storage.delete(key),
      clear:()=>{
        storage.clear();
        clear();
      },
    });
  }
  Object.defineProperty(window, "sessionStorage", {
    value:createStorage(),
  });
  Object.defineProperty(window, "localStorage", {
    value:createStorage(backup),
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
})

const generateDemoPage = async (project) => {
  const entryFile = project.findFileById(project.entryFile);
  const dom = new DOMParser().parseFromString(binaryString2String(entryFile.value), "text/html");
  
  if(!dom.querySelector(`script[type="importmap"]`)){
    dom.head.insertBefore(make("script", {type:"importmap"}), dom.head.firstChild);
  }
  const importMapScript = [...dom.querySelectorAll(`script[type="importmap"]`)].pop();
  const importsMap = JSON.parse(importMapScript.textContent||JSON.stringify({"imports":{}}));
  const scriptFiles = project.findFilesByLanguage("javascript");
  const dataUris = await Promise.all(scriptFiles.map(({path,file}) => file2DataUri(file.name, binaryString2String(file.value)).then(data=>({path,data}))));
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
              Object.assign(o,{[path]:binaryString2String(file.value)}),
            {}
          )
      )
    ),
    createScriptElem(`(()=>{${getFuncContents(styleLoader)}})()`),
    makeJSONImport(
      "__imported_script_map",
      JSON.stringify(
        scriptFiles.reduce(
          (o,{path,file})=>
            Object.assign(o,{[path]:binaryString2String(file.value)}),
          {}
        )
      )
    ),
    createScriptElem(`(()=>{${getFuncContents(scriptLoader)}})()`),
    makeJSONImport(
      "__local_storage_backup",
      JSON.stringify([["test", "バックアップテスト"]])
    ),
    createScriptElem(`(()=>{${getFuncContents(webStorageWrapper)}})()`),
  ];
  if(importMapScript){
    scripts.reverse().forEach(e=>importMapScript.after(e));
  }
  else{
    scripts.forEach(e=>dom.body.append(e));
  }
  return dom.documentElement.innerHTML;
}

export default generateDemoPage;