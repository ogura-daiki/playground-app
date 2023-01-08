export default {
  insertData:(project) => {
    return project.findFilesByLanguageWithFilePath("javascript")
      .reduce(
        (o,{path,file})=>
          Object.assign(o,{[path]:file.stringValue}),
        {}
      );
  },
  onProcess:(scripts) => {
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
}