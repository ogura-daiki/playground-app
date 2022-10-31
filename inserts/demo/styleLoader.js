export default {
  insertData:(project) => {
    return project.findFilesByLanguage("css")
      .reduce(
        (o,{path,file})=>
          Object.assign(o,{[path]:file.stringValue}),
        {}
      )
  },
  onProcess:(styles) => {
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
}