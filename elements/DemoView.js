import generateDemoPage from "../libs/generateDemoPage.js";
import { LitElement, html, css, when, until } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class DemoView extends LitElement {
  static get properties(){
    return {
      _project:{type:Object},
    };
  }
  constructor(){
    super();
    this._project = undefined;
  }
  static get styles() {
    return css`
      :host{
        display:block;
        background:white;
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
  #renderDemo(){
    const loading = `
    <style>
      html,body{
        width:100%;
        height:100%;
        margin:0px;
      }
      #loading{
        width:100%;
        height:100%;
        display:grid;
        place-items:center;
      }
      #loading .circle{
        width:4rem;height:4rem;border:.5rem solid rgb(12, 138, 255);border-radius:50%;
        border-right-color: rgb(12, 138, 255, .2);
        animation:spin infinite both 1s linear, fade_in 1 both 1s .5s;
      }
      @keyframes spin {
        from{transform:rotateZ(0deg)}
        to{transform:rotateZ(360deg)}
      }
      @keyframes fade_in {
        from{opacity:0}
        to{opacity:1}
      }
    </style>
    <div id="loading">
      <div class="circle"></div>
    </div>
    `;
    return until(generateDemoPage(this._project), loading);
  }
  render(){
    console.log(this._project);
    return html`
    <iframe
      id="iframe"
      sandbox="allow-scripts allow-modals allow-downloads allow-popups"
      .srcdoc=${when(this._project, ()=>this.#renderDemo(), ()=>"")}
    >
    `;
  }
  set project(project) {
    console.log({project})
    const before = this._project;
    this._project = project;
    if(before === project){
      this.requestUpdate();
    }
  }
  sendMessage(msg) {
    this.renderRoot.querySelector("#iframe").contentWindow.postMessage(msg, "*");
  }
}

customElements.define("demo-view", DemoView);

