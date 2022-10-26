
import { LitElement, html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';
import make from "./libs/make.js";
import Store from "./libs/Store.js";
import "./elements/MonacoEditor.js";
import generateDemoPage from './libs/generateDemoPage.js';
import { newFile, newFolder } from './Models/File.js';
import { newProject } from './Models/Project.js';


const when = (cond, val, elseVal=()=>"") => cond?val():elseVal();

const iconFonts = css`
/**
* アイコンフォント定義
*/
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");
/* クラス指定が長いので iタグで代替 */
i {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
i {
  font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48;
  /*font-size:1.5em;*/
  user-select:none;
  margin-top: -0.05em;
}
`;
document.head.append(make("style", {textContent:iconFonts}));
class BaseElement extends LitElement{
  static get styles(){
    return [
      iconFonts,
      css`
        .fill {
          width: 100%;
          height: 100%;
          box-sizing:border-box;
        }

        .col, .row{
          display:flex;
        }
        .col{
          flex-flow:column;
        }
        .row{
          flex-flow:row;
        }

        .grow{
          flex-grow:1;
          flex-basis:0px;
        }

        .centering{
          display:grid;
          place-items:center;
        }
      `,
    ];
  }
}
const debounce = func => {
  let timer;
  return {
    clear: () => {
      clearTimeout(timer);
    },
    push(time, props) {
      this.clear();
      timer = setTimeout(() => func(false, props), time);
    },
    force(props) {
      this.clear();
      func(true, props);
    },
  };
}

class PlayGroundApp extends BaseElement {
  static get properties() {
    return {
      config: { type: Object },
      ctx: { type: Object },
      projects: { type: Array },
      menu_opened: { type: Boolean },
      files_opened: { type: Boolean },
    };
  }
  constructor() {
    super();
    this.updater = debounce((force, { auto_refresh=false }={}) => {
      if (force || auto_refresh) {
        this.renderRoot.querySelector("#demo-view").project = this.getCurrentProject();
      }
    });
    this.config = Store.get("config");
    this.ctx = Store.get("ctx");
    this.projects = Store.get("projects");
    this.menu_opened = false;
    this.files_opened = false;

  }
  static get styles() {
    return [
      super.styles,
      css`
        :host{
          display:block;
        }
        #container {
          background: #fff;
          gap: 4px;
        }

        #input {
        }

        #ig {
          background: #eee;
        }

        .top_menu{
          display:block;
          padding:4px 12px;
          width:52px;
          background:transparent;
          border-right:1px solid lightgray;
        }
        .menu_icon{
          position:relative;
          aspect-ratio:1;
          width:100%;
          --stroke-color:white;
          --stroke-width:3px;
          transition:transform .3s;
        }
        .menu_icon:before, .menu_icon:after{
          content:"";
          display:block;
          width:100%;
        }
        .menu_icon:before{
          border:solid var(--stroke-color);
          border-width:var(--stroke-width) 0px;
          box-sizing:border-box;
          height:60%;
          transition:height .3s, background .3s, transform .3s, border .3s;
        }
        .menu_icon:after{
          height:var(--stroke-width);
          background:var(--stroke-color);
          position:absolute;
          top:calc(50% - var(--stroke-width) / 2 );
          left:0%;
          transition:transform .3s;
        }

        .open .menu_icon{
          transform:rotateZ(180deg);
        }
        .open .menu_icon:before{
          height:var(--stroke-width);
          background:white;
          border-width:0px;
          border-color:transparent;
          transform:rotateZ(45deg);
        }
        .open .menu_icon:after{
          transform:rotateZ(-45deg);
        }

        .code_area{
          position:relative;
          background:black;
          color:white;
        }
        .code_area .no_opened_file{
          font-size:.5em;
          user-select:none;
          aspect-ratio:1;
          background:rgba(255,255,255,.5);
          padding:16px;
          border-radius:16px;
        }

        .projects_area{
          position:absolute;
          top:0px;
          left:0px;
          overflow-y:scroll;
          z-index:99999;
          background:white;
        }
        .projects_area .title{
          position:sticky;
          top:0px;
          background:white;
          padding:4px;
          font-size:1.5em;
        }
        .projects_area .projects{
          gap:8px;
          padding:8px;
        }

        .file_tabs{
          padding-right:8px;
          overflow-x:overlay;
          background:darkslateblue;
        }

        .scroll_overlay::-webkit-scrollbar {
          width:4px;
          height:4px;
        }
        /*スクロールバーの軌道*/
        .scroll_overlay::-webkit-scrollbar-track {
          border-radius: 10px;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
        }

        /*スクロールバーの動く部分*/
        .scroll_overlay::-webkit-scrollbar-thumb {
          background-color: rgba(200,200,200, .5);
          border-radius: 10px;
          box-shadow:0 0 0 1px rgba(255, 255, 255, .3);
        }
        .filelist_open_button{
          position:sticky;
          left:0px;
          aspect-ratio:1;
          padding:0px;
          user-select:none;
          width:3em;
          outline:none;
          border:none;
          background:darkslateblue;
          border-right:1px solid white;
        }
        .filelist_open_button:where(:hover, :active){
          background:rgb(100,100,140);
        }
        .filelist_open_button i{
          font-size:2em;
          color:white;
        }
        .file_tab{
          padding:4px 0px 4px 8px;
          gap:4px;
          align-items:center;
          border-right:1px solid lightgray;
          color:white;
          background:rgba(100,100,0,0);
        }
        .file_tab.open{
          background:rgba(255,255,200,.2);
        }
        .file_tab .close_button{
          width:1.5em;
          aspect-ratio:1;
          border-radius:.2em;
          user-select:none;
          margin:4px;
          font-size:1em;
        }
        .file_tab .close_button:where(:hover, :open){
          background:rgba(255,255,200,.2)
        }

        .files_area{
          position:absolute;
          top:0px;
          left:0px;
          user-select:none;
          /*ガラス調に*/
          background: rgba( 47, 47, 47, 0.6 );
          /*box-shadow: 0 8px 32px 0 rgba( 31, 38, 135, 0.37 );*/
          backdrop-filter: blur( 2px );
          -webkit-backdrop-filter: blur( 2px );
          border: 1px solid rgba( 255, 255, 255, 0.18 );
          color:white;
        }
        .files_area .title{
          font-size:1.5em;
          background: rgba( 47, 47, 47, 0.85 );
          padding:4px 12px;
        }
        .files_area .files{
          overflow-y:scroll;
        }
        tree-file.root{
        }
      `
    ];
  }
  projectList() {
    return html`
      <div class="fill col projects_area">
        <div class="title">プロジェクト一覧<button style="margin-left:auto;" @click=${e => {
          this.updateProjects(ps => {
            ps.push(newProject());
          });
          this.requestUpdate();
        }}>+</button></div>
        <div class="grow col projects">
          ${this.projects.map(({ id, name }) => html`
            <div
              style="padding:4px;background:${this.ctx.project===id?"yellow":"lightgray"};"
              @click=${e=>{
                if(this.ctx.project === id){
                  return;
                }
                this.updateCtx(ctx=>{
                  ctx.project = id;
                });
                this.menu_opened = false;
                this.requestUpdate();
              }}
            >${name}</div>
          `)}
        </div>
      </div>
    `
  }
  fileList() {
    const project = this.getCurrentProject();
    //const files = project.files;

    const getFileTypeName = file => ({folder:"フォルダ",file:"ファイル"}[file.type]);

    const equalsName = (f1, f2) => f1.name === f2.name;

    const onSelect = (file)=>{
      this.openTab(project, file.id);
    }
    const onCreate = ({files, value:newFile})=>{
      if(files.some(f=>f.name === newFile.name)){
        alert(`${getFileTypeName(newFile)}名：${newFile.name}はフォルダ内に既に存在します。`);
        return;
      }
      this.updateProjects(()=>{
        files.push(newFile);
      });
      this.requestUpdate();
    }
    const onRename = ({files,file,name})=>{
      if(project.entryFile === file.id){
        const lang = getLanguageFromFileName(name);
        if(lang !== "html"){
          alert(`初期ファイルはhtml文書である必要があります。`);
          return;
        }
      }
      if(files.some(f=>f!==file&&f.name === name)){
        alert(`${getFileTypeName(file)}名：${name}はフォルダ内に既に存在します。`);
        return;
      }
      this.updateProjects(()=>{
        file.name = name;
      });
      this.requestUpdate();
    }
    const onDelete = ({files,file})=>{
      if(file.id === project.entryFile){
        alert("初期ファイルは削除できません");
        return;
      }
      if(file.type==="folder" && project.hasEntryFile(file)){
        alert("フォルダ内に初期ファイルが含まれているので削除できません");
        return;
      }
      if(confirm(`${getFileTypeName(file)}名：${file.name}を削除してもよろしいですか？`)){
        this.updateProjects(()=>{
          if(project.tabs.includes(file.id)){
            this.closeTab(project, file.id);
          }
          files.splice(files.findIndex(v=>v===file),1);
        });
        this.requestUpdate();
      }
    }
    const onMove = ({to, fileId})=>{
      const fromFiles = project.findParentByFileId(fileId);
      if(fromFiles === to.files){
        return;
      }
      const file = project.findFileObjFromId(fileId);
      if(to.files.some(f=>f.name===file.name)){
        return;
      }
      if(project.hasRefLoop(to.files, file)){
        return false;
      }
      const fromIdx = fromFiles.findIndex(f=>f.id === file.id);
      this.updateProjects(()=>{
        fromFiles.splice(fromIdx, 1);
        to.files.push(file);
      })
      this.requestUpdate();
    }

    return html`
      <div class="col fill files_area">
        <div class="title">ファイル一覧</div>
        <div class="col scroll_overlay files grow">
          <tree-file
            class="root"
            .open=${true}
            .data=${{ name: project.name, type: "folder", files:project.files }}
            .nest=${0}
            @select=${({detail})=>onSelect(detail)}
            @rename=${({detail})=>onRename(detail)}
            @create=${({detail})=>onCreate(detail)}
            @delete=${({detail})=>onDelete(detail)}
            @move=${({detail})=>onMove(detail)}
          ></tree-file>
        </div>
      </div>
    `
  }
  openTab(pro, id){
    this.updateProjects(()=>{
      if(!pro.tabs.includes(id)){
        pro.tabs.push(id);
      }
      pro.opened = id;
    });
    this.requestUpdate();
  }
  selectTab(pro,id){
    this.updateProjects(()=>{
      pro.opened = id;
    });
    this.files_opened = false;
    this.requestUpdate();
  }
  closeTab(pro, id){
    const idx = pro.tabs.findIndex(tab=>tab===id);
    this.updateProjects(()=>{
      pro.tabs.splice(idx, 1);
      if(pro.opened === id){
        pro.opened = pro.tabs[idx-1]??pro.tabs[idx];
      }
    });
    this.requestUpdate();
  }
  fileTabs(){
    const pro = this.getCurrentProject();
    return html`
    <div class="row file_tabs scroll_overlay">
      <button
        class="centering filelist_open_button"
        @click=${e => { this.files_opened = !this.files_opened }}
      ><i>file_copy</i></button>
      ${pro.tabs.map((id) => html`
        <div class="row file_tab ${when(id===pro.opened,()=>"open")}"
          @click=${e=>this.selectTab(pro, id)}
        >
          <span>${pro.findFileById(id).name}</span>
          <i
            class="centering close_button"
            @click=${e=>{
              this.closeTab(pro, id);
              e.stopPropagation();
            }}
          >close</i>
        </div>
      `)}
    </div>
    `;
  }

  getCurrentProject() {
    let pro = this.projects.find(({ id }) => id === this.ctx.project);
    if(pro){
      return pro;
    }
    pro = this.projects[0];
    this.ctx.project = pro.id;
    return pro;
  }

  #topBar(project){
    return html`
    <div class="top_bar row" style="background:darkblue;">
      <button class="top_menu ${when(this.menu_opened,()=>"open")}" @click=${e => this.menu_opened = !this.menu_opened}>
        <div class="menu_icon centering"></div>
      </button>
      <input type="text" .value=${project.name} @input=${e => this.updateProjects(() => {
        project.name = e.target.value;
      })}>
    </div>
    `;
  }

  #editor(project){
    return html`
    <monaco-editor .file=${project.getOpenedFile()} id="input" class="fill" @updateValue=${e => {
      const {file, newVal} = e.detail;
      this.updateProjects(() => {
        file.stringValue = newVal;
      });
      this.updater.push(this.config.refresh_wait, {
        auto_refresh: this.config.auto_refresh
      });
    }}></monaco-editor>
    `;
  }

  #fileNotSelected(){
    return html`
    <div class="fill centering">
    <div class="centering no_opened_file">
      <i style="font-size:8em;line-height:1em;">file_copy</i>
      <span>ファイルが開かれていません</span>
      <button
        @click=${e=>{this.files_opened=true;}}
      >ファイルリストを開く</button>
    </div>
    `;
  }

  render() {
    const project = this.getCurrentProject();
    return html`
      <div class="col fill">
        ${this.#topBar(project)}
        <div class="grow" style="position:relative;">
          <split-panel id="container" class="fill" count=2 weight_sum=2 weights="[1,1]" min_weights="[0.1,0.1]">
            <div slot=0 class="fill col">
              ${this.fileTabs()}
              <div class="grow code_area">
                ${when(
                  project.opened!=null,
                  ()=>this.#editor(project),
                  ()=>this.#fileNotSelected()
                )}
                ${when(this.files_opened, ()=>this.fileList())}
              </div>
              <div>
                <label>自動反映<input type="checkbox" .checked=${this.config.auto_refresh} @input=${e => {
                  this.updateConfig(config => {
                    config.auto_refresh = e.target.checked
                  });
                }}></label>
                <button id="run" @click=${e => {
                  this.updater.force();
                }}>RUN</button>
              </div>
            </div>
            <div slot=1 class="fill">
              <demo-view id="demo-view" class="fill"></demo-view>
            </div>
          </split-panel>
          ${when(this.menu_opened, ()=>this.projectList())}
        </div>
      </div>
    `;
  }

  updateCtx(func) {
    func(this.ctx);
    Store.set("ctx", this.ctx);
  }

  updateConfig(func) {
    func(this.config);
    Store.set("config", this.config);
  }

  updateProjects(func) {
    func(this.projects);
    Store.set("projects", this.projects);
  }

  #compileProject(){
    const project = this.getCurrentProject();
    const entryFile = project.findFileById(project.entryFile);
    return entryFile.value;
  }
}
customElements.define("playground-app", PlayGroundApp);
document.body.append(new PlayGroundApp());

customElements.define("tree-file", class extends BaseElement {
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
        <tree-file
          @deleted=${e=>this.requestUpdate()}
          @dragend=${e=>{
            this.requestUpdate();
          }}
          .parent=${this.data}
          .data=${e}
          .nest=${this.nest + 1}
        ></tree-file>`
      )}
    </div>
    `: ""}
    `;
  }
});


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


class Split extends LitElement {
  static get properties() {
    return {
      vertical: { type: Boolean },
      count: { type: Number },
      weight_sum: { type: Number },
      weights: { type: Array },
      min_weights: { type: Array },
      knob_overflow: { type: Boolean },
      md: { state: true },
    };
  }
  updateCurrentWeight(val) {
    this.currentWeight = this.weights.map(v => v / this.weight_sum);
  }
  constructor() {
    super();
    this.vertical = false;
    this.count = 5;
    this.weight_sum = 1;
    this.weights = [0.1, 0.2, 0.2, 0.2, 0.3];
    this.min_weights = [0.05, 0.05, 0.05, 0.05, 0.05];
    this.currentWeight = [];
    this.knob_overflow = false;
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("mousemove", e => {
      if (this.md !== null) {
        let move = e.movementX / this.offsetWidth;
        if (this.vertical) {
          move = e.movementY / this.offsetHeight;
        }
        if (move < 0) {
          if (this.currentWeight[this.md] + move < this.min_weights[this.md]) {
            move = (this.min_weights[this.md] - this.currentWeight[this.md]) / this.weight_sum;
          }
          this.currentWeight[this.md] += move;
          this.currentWeight[this.md + 1] -= move;
        }
        else {
          if (this.currentWeight[this.md + 1] - move < this.min_weights[this.md + 1]) {
            move = (this.currentWeight[this.md + 1] - this.min_weights[this.md + 1]) / this.weight_sum;
          }
          this.currentWeight[this.md] += move;
          this.currentWeight[this.md + 1] -= move;
        }
        this.requestUpdate();
      }
    });
    window.addEventListener("mouseup", e => {
      this.md = null;
    });
  }
  createKnob(i) {
    const knob = html`
      <div class="knob ${this.vertical ? "v" : "h"}"
      @mousedown=${e => {
        this.md = i;
      }}></div>
    `;
    if (this.knob_overflow) {
      return html`
        <div style="
          overflow:visible;
          ${this.vertical ? "height" : "width"}:0px;
          position:relative;
          user-select:none;
        ">
          <div class="knob ${this.vertical ? "v" : "h"}" style="
            ${this.vertical ? "top" : "left"}:-4px;
            position:absolute;
          "
          @mousedown=${e => {
            this.md = i;
          }}></div>
        </div>
      `;
    }
    else {
      return knob;
    }
  }
  render() {
    if (this.currentWeight.length !== this.count) {
      this.updateCurrentWeight(this.count);
    }
    return html`
    <style>
      :host{
        cursor:${this.md != null ? (this.vertical ? "row-resize" : "col-resize") : ""};
      }
    </style>
    <div style="width:100%;height:100%;display:flex;align-items:stretch;flex-direction:${this.vertical ? "column" : "row"};">
    ${[...Array(this.count)].map((v, i) => html`
      <slot
        name="${i}"
        style="
          ${this.md != null ? "user-select:none;pointer-events:none;" : ""}
          ${this.vertical ? "height" : "width"}:${this.currentWeight[i] * 100}%;
          display:block;
          overflow:hidden;
        "
      >${i}</slot>
    `).reduce((c, v, i) => {
      c.push(v);
      if (i + 1 < this.count) {
        c.push(this.createKnob(i));
      }
      return c;
    }, [])}
    </div>
`;
  }
  static get styles() {
    return css`
      :host{
        display:block;
      }
      .knob.h{
        background:rgba(99,99,99,.2);
        width:8px;
        height:max(100%,8px);
        border:solid rgba(50,50,50,.2) 1px;
        user-select:none;
        box-sizing:border-box;
        cursor:col-resize;
      }
      .knob.v{
        background:rgba(99,99,99,.2);
        height:8px;
        width:max(100%,8px);
        border:solid rgba(50,50,50,.2) 1px;
        user-select:none;
        box-sizing:border-box;
        cursor:row-resize;
      }
    `;
  }
}

customElements.define("split-panel", Split);