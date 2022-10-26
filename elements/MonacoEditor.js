await new Promise(resolve=>{
  const script = document.createElement("script");
  script.addEventListener("load", e=>resolve());
  script.src = "https://unpkg.com/monaco-editor@latest/min/vs/loader.js";
  document.body.append(script);
});

require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
const proxy = URL.createObjectURL(new Blob([`
  self.MonacoEnvironment = {
    baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
  };
  importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');
`], { type: 'text/javascript' }));
window.MonacoEnvironment = { getWorkerUrl: () => proxy };
await new Promise(resolve=>{require(["vs/editor/editor.main"], resolve)});

class MonacoEditor extends HTMLElement{
  #file={};
  #editor;
  constructor(){
    super();
    this.theme="vs-dark";
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML=`
    <style>${this.constructor.styles}</style>
    ${this.render()}
    `;
  }
  static get styles(){
    return `
      :host{
        display:block;
      }
      #editor{
        display:block;
        position:absolute;
        top:0px;
        left:0px;
        margin:0px;
        padding:0px;
        width:100%;
        height:100%;
        overflow:hidden;
      }
    `;
  }
  render(){
    return `
    <link rel="stylesheet" href="https://unpkg.com/monaco-editor@0.34.0/min/vs/editor/editor.main.css"></link>
    <div id=editor></div>
    `
  }
  update() {
    if(this.#editor){
      this.#editor.getModel().setValue(this.#file.stringValue);
      monaco.editor.setModelLanguage(this.#editor.getModel(), getLanguageFromFileName(this.#file.name));
      monaco.editor.setTheme(this.theme);
      return;
    }
    this.#editor = monaco.editor.create(this.shadowRoot.querySelector("#editor"), {
      value: this.#file.stringValue,
      language: getLanguageFromFileName(this.#file.name),
      theme: this.theme,
      automaticLayout: true,
    });
    this.#editor.getModel().onDidChangeContent((event) => {
      this.dispatchEvent(new CustomEvent("updateValue", {detail:{file:this.#file, newVal:this.#editor.getValue()}}));
    });
  }
  set file(val){
    if(this.#file === val) return;
    this.#file = val;
    this.update();
  }
  get file(){
    return this.#file;
  }
}
customElements.define("monaco-editor", MonacoEditor);