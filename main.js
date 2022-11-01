
import { html, css, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import "./elements/MonacoEditor.js";
import { newProject, copyProject } from './Models/Project.js';
import BaseElement from './elements/BaseElement.js';
import "./elements/FileTree.js";
import { newFile, newFolder } from './Models/File.js';
import "./elements/Split.js";
import "./elements/DemoView.js";
import "./elements/MenuIcon.js";
import { incrementFileNameSuffix } from './libs/incrementFileNameSuffix.js';
import LocalStorageStore from 'https://ogura-daiki.github.io/store/LocalStorageStore.js';
import Models from "./Migrations/index.js";

const store = new LocalStorageStore(Models);

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
      searchText: { type: String },
    };
  }
  constructor() {
    super();
    this.updater = debounce((force, { auto_refresh=false }={}) => {
      if (force || auto_refresh) {
        this.renderRoot.querySelector("#demo-view").project = this.getCurrentProject();
      }
    });
    this.config = store.get("config");
    this.ctx = store.get("ctx");
    this.projects = store.get("projects");
    this.menu_opened = false;
    this.files_opened = false;
    this.searchText = "";

    
    //const self = this;
    window.addEventListener("message", (event) => {
      const actionName = event.data?.action;
      const actions = new Map(Object.entries({
        localStorage: ({project, detail})=>{
          if(this.ctx.project !== project) return;
          const {action, args} = detail;
          const pro = this.getCurrentProject();
          if(action === "clear"){
            this.updateProjects(()=>{
              pro.localStorage = [];
            });
            return;
          }
          const targetIndex = pro.localStorage.findIndex(([name])=>name === args[0]);
          if(targetIndex === -1){
            if(action==="remove") return;
          }

          this.updateProjects(()=>{
            if(action === "set") {
              if(targetIndex===-1){
                pro.localStorage.push([args[0], args[1]]);
              }
              else{
                pro.localStorage[targetIndex] = [args[0], args[1]]
              }
            }
            else if(action === "remove") {
              pro.localStorage.splice(targetIndex, 1);
            }
          });
        },
      }));
      if(!actions.has(actionName)) return;
      this.renderRoot.getElementById("demo-view").sendMessage(actions.get(actionName)(event.data));
    }, false);
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
          padding:8px 8px;
          width:3rem;
          background:transparent;
          border-right:1px solid lightgray;
        }
        .menu_icon{
          aspect-ratio:1;
          width:2.5rem;
          height:2.5rem;
          color:white;
        }
        .menu_icon i{
          margin-top:0px;
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
          font-size:.5rem;
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
          z-index:99999;
          background:darkslateblue;
          color:white;
        }
        .projects_area .title{
          background:inherit;
          padding:4px;
          font-size:1.5rem;
          box-shadow:0px 2px 4px 0px rgba(0,0,0,.2);
        }
        .projects_area .title span{
          padding:0px 16px;
        }
        .projects_area .title .append{
          font-size:inherit;
          padding:0px 8px;
        }
        .projects_area .projects{
          padding:8px;
          overflow-y:scroll;
        }
        .projects_area .project{
          border-bottom: 1px solid white;
          padding:8px;
        }
        .projects_area .project.selected{
          background:rgba(255,255,255,.2);
        }
        .projects_area .project .badge{
          background:white;
          padding:4px 12px;
          font-size:.5rem;
          color:black;
          display:grid;
          place-items:center;
          border-radius:999999vmax;
          align-self:center;
        }
        .projects_area .project .menu_list{
          gap:4px;
          padding-left:8px;
          align-items:center;
        }
        .projects_area .project .menu{
          width:1.5rem;
          height:1.5rem;
          font-size:1rem;
          background:transparent;
          border-radius:.2rem;
        }
        .projects_area .project .menu:hover{
          background:rgba(255,255,255,.2);
        }
        
        
        .file_tabs{
          background:darkslateblue;
        }

        .file_tabs .tab_list{
          padding-right:8px;
          overflow-x:overlay;
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
          padding:0px;
          user-select:none;
          width:2.5rem;
          height:2.5rem;
          flex-shrink:0;
          outline:none;
          border:none;
          background:darkslateblue;
          border-right:1px solid white;
        }
        .filelist_open_button:where(:hover, :active){
          background:rgb(100,100,140);
        }
        .filelist_open_button i{
          font-size:1.5rem;
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
          width:1.5rem;
          aspect-ratio:1;
          border-radius:.2rem;
          user-select:none;
          margin:4px;
          font-size:1rem;
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
          font-size:1.5rem;
          background: rgba( 47, 47, 47, 0.85 );
          padding:4px 12px;
        }
        .files_area .files{
          overflow-y:scroll;
        }
        file-tree.root{
        }
      `
    ];
  }

  #searchProjects(){
    return this.projects.reduce((c,p,i)=>{if(!this.searchText || p.name.match(this.searchText)){c.push([p,i])}return c;},[]);
  }

  #projectListItem(project, idx){
    const {id, name} = project;
    const onDelete = e=>{
      e.stopPropagation();
      if(this.ctx.project===id){
        alert("選択中のプロジェクトは削除できません");
        return;
      }
      if(!confirm(`プロジェクト：${name}を削除してもよろしいですか？`)){
        return;
      }
      this.updateProjects(projects=>{
        projects.splice(idx,1);
      });
      this.requestUpdate();
    };
    const onCopy = e=>{
      e.stopPropagation();
      this.updateProjects(projects=>{
        const newName = incrementFileNameSuffix(name, projects.map(p=>p.name));
        const copiedProject = copyProject(newName, project);
        projects.push(copiedProject);
      });
      this.requestUpdate();
    }
    const menuButton = (icon, click) => html`
    <i class="centering menu" @click=${click}>${icon}</i>
    `;
    return html`
      <div
        class="project row ${when(this.ctx.project===id, ()=>"selected")}"
        @click=${e=>{
          if(this.ctx.project === id){
            return;
          }
          this.updateCtx(ctx=>{
            ctx.project = id;
          });
          //this.menu_opened = false;
          this.requestUpdate();
          this.renderRoot.querySelector("#demo-view").project = undefined;
        }}
      >
        <span class=grow>${name}</span>
        ${when(this.ctx.project===id, ()=>html`<div class=badge>選択中</div>`)}
        <div class="row menu_list">
          ${menuButton("content_copy", onCopy)}
          ${menuButton("delete", onDelete)}
        </div>
      </div>
    `;
  }


  projectList() {
    const searchedProjects = this.#searchProjects();
    return html`
      <div class="fill col projects_area">
        <div class="title row">
          <span class=grow>プロジェクト一覧</span>
          <i class="append centering" @click=${e => {
            this.updateProjects(ps => {
              ps.push(newProject());
            });
            this.requestUpdate();
          }}>add</i>
        </div>
        <div class="row" style="padding:8px;gap:8px;">
          <span>検索</span>
          <input type=text class=grow .value=${this.searchText??""} @input=${e=>{
            this.searchText = e.target.value.trim();
          }}>
        </div>
        <div class="grow col projects scroll_overlay">
          ${when(
            !!searchedProjects.length,
            ()=>searchedProjects.map(sr=>this.#projectListItem(...sr)),
            ()=>html`
              <div class="fill centering">
                <div class="centering">
                  <i style="font-size:4rem">search</i>
                  <span>"${this.searchText}"に該当するプロジェクトは存在しません。</span>
                </div>
              </div>
            `
          )}
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
    const onCreate = ({files, name, type})=>{
      if(files.some(f=>f.name === newFile.name)){
        alert(`${getFileTypeName(newFile)}名：${newFile.name}はフォルダ内に既に存在します。`);
        return;
      }
      this.updateProjects(()=>{
        files.push({ file:newFile, folder:newFolder }[type]({name}));
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
          <file-tree
            class="root"
            .open=${true}
            .data=${{ name: project.name, type: "folder", files:project.files }}
            .nest=${0}
            @select=${({detail})=>onSelect(detail)}
            @rename=${({detail})=>onRename(detail)}
            @create=${({detail})=>onCreate(detail)}
            @delete=${({detail})=>onDelete(detail)}
            @move=${({detail})=>onMove(detail)}
          ></file-tree>
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
    <div class="row file_tabs">
      <button
        class="centering filelist_open_button"
        @click=${e => { this.files_opened = !this.files_opened }}
      ><i>file_copy</i></button>
      <div class="tab_list row scroll_overlay">
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
      <menu-icon class="menu_icon" ?open=${this.menu_opened} @click=${e=>{
        this.menu_opened = !this.menu_opened;
      }}>
        <i slot=open>menu</i>
        <i slot=close>close</i>
      </menu-icon>
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
      <i style="font-size:4rem;">file_copy</i>
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
          <split-panel id="container" class="fill" count=2 weight_sum=2 weights="[1,1]" min_weights="[0,0]">
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
    store.set("ctx", this.ctx);
  }

  updateConfig(func) {
    func(this.config);
    store.set("config", this.config);
  }

  updateProjects(func) {
    func(this.projects);
    store.set("projects", this.projects);
  }

  #compileProject(){
    const project = this.getCurrentProject();
    const entryFile = project.findFileById(project.entryFile);
    return entryFile.value;
  }
}
customElements.define("playground-app", PlayGroundApp);
document.querySelector("#loading").remove();
document.body.append(new PlayGroundApp());
