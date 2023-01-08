import { html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { createId } from '../libs/ModelUtil.js';
import BaseElement from './BaseElement.js';

const dataTransferKey = createId();

class FileTree extends BaseElement {
  static get styles(){
    return [
      super.styles,
      css`
        :host{
          display:inline;
          min-width:100%;
          width:fit-content;
        }
        :host(.root){
          display:block;
        }
        :host(.root) .main{
          position:sticky;
          top:0px;
          z-index:1;
          background:#282828;
        }
        .main{
          box-shadow: rgba(255,255,255,.2) 0px 1px 0px 0px;
          position:relative;
        }
        .main:hover{
          background: rgba(255,255,255,.2);
          padding-right:4rem;
        }
        .name{
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          min-width:8rem;
        }
        .main:hover .name{
          min-width:0rem;
        }
        .icon{
          min-width:1rem;
          width:1rem;
        }
        .folder_arrow{
          font-family:monospace;
          font-weight:bold;
          transition:transform .1s;
          font-size:.8rem;
        }
        .menu_button{
          border:0px;
          margin:0px;
          padding:0px;
          background:transparent;
          border-radius:.2rem;
          color:white;
          width:1.5rem;
        }
        .menu_button:where(:hover, :active){
          background:rgba(255,255,255,.2);
        }
        .menu_button i{
          font-size:1rem;
        }
        .menu{
          pointer-events:none;
          overflow:hidden;
          opacity:0;
          gap:2px;
          height:100%;
        }
        .main:hover .menu{
          pointer-events:auto;
          opacity:1;
        }

        .main {
          display: grid;
          grid-template-columns:min-content minmax(4rem, 1fr) min-content;
          grid-template-rows: 1fr;
          grid-template-areas: 'g1 g2 g3';
        }
        .main>*{
          height:100%;
        }

        .area-g1 {
          grid-area: g1;
        }
        .area-g2 {
          grid-area: g2;
        }
        .area-g3 {
          grid-area: g3;
        }
      `
    ]
  }
  static get properties() {
    return {
      nest: { type: Number },
      project: { type: Object },
      data: { type: Object },
      open: { type: Boolean },
    }
  }
  constructor() {
    super();
    this.project = undefined;
    this.data = undefined;
    this.nest = 0;
    this.open = false;
  }
  
  getIcon(){
    if(this.data.type === "folder"){
      return html`<div class="folder_arrow" style="transform:rotateZ(${this.open ? "90" : "0"}deg);">&gt;</div>`;
    }
    
    const lang = getLanguageFromFileName(this.data.name);
    return lang
    ?{
      html:html`<span style="font-size:0.5rem;color:salmon">&lt;&gt;</span>`,
      css:html`<span style="font-size:0.8rem;color:skyblue">#</span>`,
      javascript:html`<span style="font-size:0.5rem;color:yellow">JS</span>`,
    }[lang]
    :html`<span style="font-size:0.5rem;color:lightpink">?</span>`;
  }
  padLeft(){
    if(!this.nest) return "";
    return html`
    <div class="row" style="gap:4px;align-self:stretch">
      ${[...Array(this.nest)].map(() => html`
        <div style="width:.5rem;box-sizing:border-box;border-right:solid white 1px"></div>
      `)}
    </div>
    `
  }
  render() {
    if(!this.project || !this.data) return;
    return html`
    <div
      class="${this.data.type} main"
      title=${this.data.name}
      .draggable=${this.nest > 0}
      style="gap:4px;padding-right:8px;align-items: center;"
      @click=${e => {
        if (this.data.type === "folder") {
          this.open = !this.open;
          return;
        }
        this.emit("select", this.data);
      }}
      @dragstart=${e=>{
        e.dataTransfer.setData(dataTransferKey, this.data.id);
      }}
      @dragover=${e=>{
        e.preventDefault();
      }}
      @drop=${e=>{
        e.preventDefault();
        const fileId = e.dataTransfer.getData(dataTransferKey);
        const toFolder = this.data.type === "folder"?this.data.id:this.data.parent;
        this.emit("move", {
          to:toFolder,
          fileId,
        });
        if(this.data.type==="file"){
          this.emit("dragend");
          return;
        }
        this.requestUpdate();
      }}
    >
      <div class='area-g1 row' style="overflow:hidden;gap:4px">
        ${this.padLeft()}
        <div class="centering icon">
          ${this.getIcon()}
        </div>
      </div>
      
      <div class="area-g2 name grow">
        ${this.data.name}
      </div>
      
      <div class='area-g3'>
        <div class="row menu" @click=${e=>{
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}>
          ${this.nest?html`
            <button class="centering menu_button" @click=${e=>{
              const name = prompt(this.data.typeString+"名を変更", this.data.name)?.trim();
              if(name){
                this.emit("rename", {
                  file:this.data,
                  name,
                });
                this.requestUpdate();
              }
            }}><i>drive_file_rename_outline</i></button>
            <button class="centering menu_button" @click=${e=>{
              this.emit("delete", {
                file:this.data,
              });
              this.emit("deleted", {
                file:this.data,
              });
            }}><i>delete</i></button>
          `:""}
          ${this.data.type==="folder"?html`
            <button class="centering menu_button" @click=${e=>{
              const name = prompt("ファイル名を入力")?.trim();
              if(name){
                this.emit("create", {
                  type:"file",
                  name,
                  to:this.data,
                });
                this.requestUpdate();
              }
            }}><i>note_add</i></button>
            <button class="centering menu_button" @click=${e=>{
              const name = prompt("フォルダ名を入力")?.trim();
              if(name){
                this.emit("create", {
                  type:"folder",
                  name,
                  files:this.data,
                });
                this.requestUpdate();
              }
            }}><i>create_new_folder</i></button>
          `:""}
        </div>
      </div>
    </div>        
    ${this.data.type === "folder" ? html`
    <div style="display:${this.open ? "contents" : "none"}">
      ${this.project.findChildren(this.data, "all").map(file =>
        html`
        <file-tree
          @deleted=${e=>this.requestUpdate()}
          @dragend=${e=>{
            this.requestUpdate();
          }}
          .project=${this.project}
          .data=${file}
          .nest=${this.nest + 1}
        ></file-tree>`
      )}
    </div>
    `: ""}
    `;
  }
}

customElements.define("file-tree", FileTree);