import generateDemoPage from "../libs/generateDemoPage.js";

class DemoView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>${this.constructor.style}</style>
    <iframe id="iframe" sandbox="allow-scripts allow-modals allow-downloads allow-popups">
    `;
  }
  set project(project) {
    generateDemoPage(project).then(e=>this.shadowRoot.querySelector("#iframe").srcdoc = e);
  }
  sendMessage(msg) {
    this.shadowRoot.querySelector("#iframe").contentWindow.postMessage(msg, "*");
  }
  static get style() {
    return `
      :host{
        display:block;
      }
      html,body{
        width:100%;
        height:100%;
      }
      iframe{
        display:block;
        outline:none;
        border:none;
        width:100%;
        height:100%;
      }
    `;
  }
}
customElements.define("demo-view", DemoView);

