import { html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';
import BaseElement from './BaseElement.js';
import { newFile, newFolder } from '../Models/File.js';

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
          min-width:1em;
          width:1em;
        }
        .folder_arrow{
          font-family:monospace;
          font-weight:bold;
          transition:transform .1s;
        }
        .menu_button{
          border:0px;
          margin:0px;
          padding:0px;
          background:transparent;
          border-radius:.2em;
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
      data: { type: Object },
      parent: { type: Object },
      open: { type: Boolean },
    }
  }
  constructor() {
    super();
    this.data = { name: "temp.html" };
    this.parent = { files: [] };
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
      html:html`<span style="font-size:0.5em;color:salmon">&lt;&gt;</span>`,
      css:html`<span style="font-size:0.8em;color:skyblue">#</span>`,
      javascript:html`<span style="font-size:0.5em;color:yellow">JS</span>`,
    }[lang]
    :html`<span style="font-size:0.5em;color:lightpink">?</span>`;
  }
  padLeft(){
    if(!this.nest) return "";
    return html`
    <div class="row" style="gap:4px;align-self:stretch">
      ${[...Array(this.nest)].map(() => html`
        <div style="width:.5em;box-sizing:border-box;border-right:solid white 1px"></div>
      `)}
    </div>
    `
  }
  render() {
    return html`
    <div
      class="${this.data.type} main"
      title=${this.data.name}
      .draggable=${!!this.nest}
      style="gap:4px;padding-right:8px;align-items: center;"
      @click=${e => {
        if (this.data.type === "folder") {
          this.open = !this.open;
          return;
        }
        this.dispatchEvent(new CustomEvent("select", {detail:this.data, bubbles:true, composed: true,}));
      }}
      @dragstart=${e=>{
        e.dataTransfer.setData("text", this.data.id);
      }}
      @dragover=${e=>{
        e.preventDefault();
      }}
      @drop=${e=>{
        e.preventDefault();
        const fileId = e.dataTransfer.getData("text");
        const toFolder = this.data.type==="folder"?this.data:this.parent;
        this.dispatchEvent(new CustomEvent("move", {
          detail:{
            to:toFolder,
            fileId,
          },
          bubbles:true,
          composed: true,
        }));
        if(this.data.type==="file"){
          this.dispatchEvent(new CustomEvent("dragend"));
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
              const name = prompt({folder:"フォルダ",file:"ファイル"}[this.data.type]+"名を変更", this.data.name)?.trim();
              if(name){
                this.dispatchEvent(new CustomEvent("rename", {
                  detail:{
                    files:this.parent.files,
                    file:this.data,
                    name,
                  },
                  bubbles:true,
                  composed: true,
                }));
                this.requestUpdate();
              }
            }}><i>drive_file_rename_outline</i></button>
            <button class="centering menu_button" @click=${e=>{
              this.dispatchEvent(new CustomEvent("delete", {
                detail:{
                  files:this.parent.files,
                  file:this.data,
                },
                bubbles:true,
                composed: true,
              }));
              this.dispatchEvent(new CustomEvent("deleted", {
                detail:{
                  file:this.data,
                },
              }));
            }}><i>delete</i></button>
          `:""}
          ${this.data.type==="folder"?html`
            <button class="centering menu_button" @click=${e=>{
              const name = prompt("ファイル名を入力")?.trim();
              if(name){
                this.dispatchEvent(new CustomEvent("create", {
                  detail:{
                    files:this.data.files,
                    value:newFile({name}),
                  },
                  bubbles:true,
                  composed: true,
                }));
                this.requestUpdate();
              }
            }}><i>note_add</i></button>
            <button class="centering menu_button" @click=${e=>{
              const name = prompt("フォルダ名を入力")?.trim();
              if(name){
                this.dispatchEvent(new CustomEvent("create", {
                  detail:{
                    files:this.data.files,
                    value:newFolder({name}),
                  },
                  bubbles:true,
                  composed: true,
                }));
                this.requestUpdate();
              }
            }}><i>create_new_folder</i></button>
          `:""}
        </div>
      </div>
    </div>        
    ${this.data.type === "folder" ? html`
    <div style="display:${this.open ? "contents" : "none"}">
      ${this.data.files.map(e =>
        html`
        <file-tree
          @deleted=${e=>this.requestUpdate()}
          @dragend=${e=>{
            this.requestUpdate();
          }}
          .parent=${this.data}
          .data=${e}
          .nest=${this.nest + 1}
        ></file-tree>`
      )}
    </div>
    `: ""}
    `;
  }
}

customElements.define("file-tree", FileTree);