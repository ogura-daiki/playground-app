import { html, css, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import BaseElement from './BaseElement.js';

const style = css`

:host{
  position:absolute;
  top:0px;
  left:0px;
  z-index:99999;
  background:darkslateblue;
  color:white;

  display:flex;
  flex-flow:column;
}
.title{
  background:inherit;
  padding:4px;
  font-size:1.5rem;
  box-shadow:0px 2px 4px 0px rgba(0,0,0,.2);
}
.title span{
  padding:0px 16px;
}
.title .append{
  font-size:inherit;
  padding:0px 8px;
}
.projects{
  padding:8px;
  overflow-y:scroll;
}
.project{
  border-bottom: 1px solid white;
  padding:8px;
}
.project.selected{
  background:rgba(255,255,255,.2);
}
.project .badge{
  background:white;
  padding:4px 12px;
  font-size:.5rem;
  color:black;
  display:grid;
  place-items:center;
  border-radius:999999vmax;
  align-self:center;
  user-select:none;
}
.project .menu_list{
  gap:4px;
  padding-left:8px;
  align-items:center;
}
.project .menu{
  width:1.5rem;
  height:1.5rem;
  font-size:1rem;
  background:transparent;
  border-radius:.2rem;
}
.project .menu:hover{
  background:rgba(255,255,255,.2);
}
`;

class ProjectsView extends BaseElement {
  static get properties() {
    return {
      projects:{type:Array},
      selection:{type:String},
      searchText:{type:String},
    }
  }
  constructor() {
    super();
    this.projects = [];
    this.selection = undefined;
    this.searchText = "";
  }
  static get styles() {
    return [super.styles, style];
  }

  #searchProjects(){
    if(!this.searchText){
      return this.projects;
    }
    return this.projects.reduce((c,p)=>{
      if(p.name.match(this.searchText)){
        c.push(p)
      }
      return c;
    }, []);
  }

  #projectListItem(project){
    const {id, name} = project;
    const menuButton = (icon, click) => html`
    <i class="centering menu" @click=${e=>{
      e.stopPropagation();
      click(e);
    }}>${icon}</i>
    `;
    const selected = this.selection === id;
    return html`
      <div
        class="project row ${when(selected, ()=>"selected")}"
        @click=${e=>{
          if(selected){
            return;
          }
          this.emit("selectProject", {id});
        }}
      >
        <span class=grow>${name}</span>
        ${when(selected, ()=>html`<div class=badge>選択中</div>`)}
        <div class="row menu_list">
          ${menuButton("download", e=>this.emit("downloadProject", {id}))}
          ${menuButton("content_copy", e=>this.emit("copyProject", {id}))}
          ${menuButton("delete", e=>this.emit("deleteProject", {id}))}
        </div>
      </div>
    `;
  }

  render() {
    const searchedProjects = this.#searchProjects();
    return html`
    <div class="title row">
      <span class=grow>プロジェクト一覧</span>
      <i class="append centering" @click=${e => this.emit("createProject")}>add</i>
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
        ()=>searchedProjects.map(project=>this.#projectListItem(project)),
        ()=>html`
          <div class="fill centering">
            <i style="font-size:4rem">search</i>
            <span>"${this.searchText}"に該当するプロジェクトは存在しません。</span>
          </div>
        `
      )}
    </div>
    `;
  }
}
customElements.define("view-projects", ProjectsView);