
import { html, css, when, join } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import "./elements/MonacoEditor.js";
import { newProject, copyProject, proto as ProjectProto } from './Models/v2/Project.js';
import BaseElement from './elements/BaseElement.js';
import "./elements/FileTree.js";
import { newFile, newFolder } from './Models/v2/File.js';
import "./elements/Split.js";
import "./elements/DemoView.js";
import "./elements/MenuIcon.js";
import "./elements/ProjectsView.js";
import { incrementFileNameSuffix } from './libs/incrementFileNameSuffix.js';
import LocalStorageStore from 'https://ogura-daiki.github.io/store/LocalStorageStore.js';
import Models from "./Migrations/index.js";
import generateProjectHTML from './libs/generateProjectHTML.js';
import downloadDataURI from './libs/downloadDataURI.js';

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

const style = css`
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

  .bottomMenu{
    overflow:hidden;
  }


  .file_tabs{
    overflow:hidden;
    background:darkslateblue;
  }

  .file_tabs .tab_list{
    padding-right:8px;
    overflow-x:overlay;
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
    user-select:none;
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
    /* エディタのミニマップより上側に表示されるように調整 */
    z-index:9999;
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

  .filePathWrapper{
    overflow-x:auto;
  }
  .openedFilePath{
    font-size:.7em;
    /*overflow-x:auto;*/
    gap:8px;
    padding:4px 16px;
    place-items:center;
    user-select:none;

    background:rgb(48,48,48);
  }
  .openedFilePath>.part{
  }
  .openedFilePath>.joiner{
    font-family:monospace;
    font-weight:bold;
  }
`;

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
    return [super.styles, style];
  }

  findProjectById(id){
    const idx = this.projects.findIndex(p=>p.id === id);
    const project = this.projects[idx];
    return {idx, project};
  }

  openProject(id){
    const {project} = this.findProjectById(id);
    if(!project) return;
    this.updateCtx(ctx=>{
      ctx.project = id;
    });
    this.requestUpdate();
    this.renderRoot.querySelector("#demo-view").project = undefined;
  }
  deleteProject(id){
    const {idx, project} = this.findProjectById(id);
    if(!project) return;

    const currentProject = this.getCurrentProject();
    if(project.id === currentProject.id){
      alert("選択中のプロジェクトは削除できません");
      return;
    }

    if(!confirm(`プロジェクト：${project.name}を削除してもよろしいですか？`)){
      return;
    }
    this.updateProjects(projects=>{
      projects.splice(idx, 1);
    });
    this.requestUpdate();
  }
  copyProject(id){
    const {project} = this.findProjectById(id);
    if(!project) return;
    this.updateProjects(projects=>{
      const newName = incrementFileNameSuffix(project.name, projects.map(p=>p.name));
      const copiedProject = copyProject(newName, project);
      projects.push(copiedProject);
    });
    this.requestUpdate();
  }
  async downloadProjectHTML(id){
    const {project} = this.findProjectById(id);
    if(!project) return;
    const html = await generateProjectHTML(project);
    const fileName = project.name+".html";
    const dataURI = binaryString2DataURI(string2BinaryString(html), getMimeTypeFromFileName(fileName));
    downloadDataURI(dataURI, fileName);
  }
  appendBlankProject(){
    this.updateProjects(ps => {
      ps.push(newProject());
    });
    this.requestUpdate();
  }

  projectList() {
    return html`
      <view-projects
        class="fill"

        .projects=${this.projects}
        .selection=${this.ctx.project}

        @deleteProject=${e=>this.deleteProject(e.detail.id)}
        @copyProject=${e=>this.copyProject(e.detail.id)}
        @downloadProject=${e=>this.downloadProjectHTML(e.detail.id)}
        @selectProject=${e=>this.openProject(e.detail.id)}

        @createProject=${e=>this.appendBlankProject()}
      ></view-projects>
    `;
  }
  fileList() {
    const project = this.getCurrentProject();

    const onSelect = (file)=>{
      this.openTab(project, file.id);
    };
    const onCreate = ({to, name, type})=>{
      if(this.getCurrentProject().hasSameNameInFolder(to, name)){
        alert(`ファイル名：${name}は使用できません。\nこのフォルダ内には既に同様の名称のファイル、またはフォルダが存在します。`);
        return;
      }
      this.updateProjects(()=>{
        this.getCurrentProject().files.push({ file:newFile, folder:newFolder }[type]({name, parent:to}));
      });
      this.requestUpdate();
    };
    const onRename = ({file, name})=>{
      if(project.entryFile === file.id){
        const lang = getLanguageFromFileName(name);
        if(lang !== "html"){
          alert(`初期ファイルはhtml文書である必要があります。`);
          return;
        }
      }
      if(project.hasSameNameInFolder(file.parent, name)){
        alert(`${file.typeString}名：${name}はフォルダ内に既に存在します。`);
        return;
      }
      this.updateProjects(()=>{
        file.name = name;
      });
      this.requestUpdate();
    };
    const onDelete = ({file})=>{
      if(file.id === project.entryFile){
        alert("初期ファイルは削除できません");
        return;
      }
      if(file.type==="folder" && project.containsFolder(file.id, project.entryFile)){
        alert("フォルダ内に初期ファイルが含まれているので削除できません");
        return;
      }
      if(confirm(`${file.typeString}名：${file.name}を削除してもよろしいですか？`)){
        this.updateProjects(()=>{
          const pro = this.getCurrentProject();
          const list = pro.deleteFile(file);
          list.forEach(f => this.closeTab(pro, f.id));
        });
        this.requestUpdate();
      }
    };
    const onMove = ({to, fileId})=>{
      let canMove = false;
      try{
        canMove = project.checkCanMove(to, fileId);
      }
      catch(e){
        alert(e.message);
      }
      if(!canMove){
        return;
      }
      const file = project.findFileObjById(fileId);
      this.updateProjects(()=>{
        file.parent = to;
      });
      this.requestUpdate();
    };

    return html`
      <div class="col fill files_area">
        <div class="title">ファイル一覧</div>
        <div class="col scroll_overlay files grow">
          <file-tree
            class="root"
            .open=${true}
            .project=${this.getCurrentProject()}
            .data=${{ id:undefined, name: project.name, type: "folder" }}
            .nest=${0}
            @select=${({detail})=>onSelect(detail)}
            @rename=${({detail})=>onRename(detail)}
            @create=${({detail})=>onCreate(detail)}
            @delete=${({detail})=>onDelete(detail)}
            @move=${({detail})=>onMove(detail)}
          ></file-tree>
        </div>
      </div>
    `;
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

  /**
   * 選択中のプロジェクトを取得する
   * @returns {ProjectProto}
   */
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

  /**
   * 
   * @param {ProjectProto} project 
   * @returns 
   */
  #editor(project){
    const openFile = project.getOpenedFile();
    return html`
    <div class="filePathWrapper scroll_overlay">
      <div class="openedFilePath row">${join(
        project.getFileObjPath(openFile.id).map(p=>html`<span class="part">${p}</span>`),
        ()=>html`<span class="joiner">&gt;</span>`
      )}</div>
    </div>
    <monaco-editor .file=${openFile} id="input" class="fill grow" @updateValue=${e => {
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
              <div class="grow code_area col">
                ${when(
                  project.opened!=null,
                  ()=>this.#editor(project),
                  ()=>this.#fileNotSelected()
                )}
                ${when(this.files_opened, ()=>this.fileList())}
              </div>
              <div class="bottomMenu">
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
    this.projects = [...this.projects];
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
