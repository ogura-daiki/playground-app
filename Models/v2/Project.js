import { setProto, createId } from "../../libs/ModelUtil.js";
import { FileProto, FolderProto, newFile } from "./File.js";

const searchFiles = (files, callback, { type = "file", multiple = false } = {}) => {
  const value = [];
  for (const file of files) {
    //全ファイルオブジェクトが対象でなく、このファイルオブジェクトが指定のタイプでない場合スキップする
    if(type !== "all" && file.type !== type){
      continue;
    }
    const result = callback(file);
    if(result){
      value.push(file);
      //複数ファイルを探索しない場合、該当するファイルオブジェクトが見つかったので終了
      if(!multiple){
        break;
      }
    }
  }
  if (multiple) {
    return value;
  }
  return value[0];
};

const proto = {
  findFileById(id) {
    return searchFiles(this.files, file => file.id === id);
  },
  findFileObjById(id) {
    return searchFiles(this.files, f => f.id === id, { type: "all" });
  },
  findParentByFileId(id) {
    if (this.files.some(f => f.id === id)) return this.files;
    return searchFiles(this.files, folder => {
      return folder.files.some(file => file.id === id);
    }, { type: "folder" });
  },
  findChildren(folder, type){
    return searchFiles(this.files, file=>{
      return file.parent === folder.id;
    }, {type, multiple:true});
  },
  containsFolder(parentFolderId, fobjId){
    const parentFolder = this.findFileObjById(parentFolderId);
    if (parentFolder.type !== "folder") return false;
    const filesIdMap = new Map();
    for (const f of this.files) {
      filesIdMap.set(f.id, f);
    }
    let next = this.findFileObjById(fobjId);
    do{
      if(next.id === parentFolderId){
        return true;
      }
      next = filesIdMap.get(next.parent);
    } while(next);
    return false;
  },
  hasSameNameInFolder(parentFolderId, name){
    return !!searchFiles(this.files, file=>{
      return file.parent === parentFolderId && file.name === name;
    }, {type:"all"});
  },
  hasEntryFile(parentFolder) {
    this.contains(parentFolder, this.findFileById(this.entryFile));
  },
  getOpenedFile() {
    return this.findFileById(this.opened);
  },
  findFilesByLanguageWithFilePath(language) {
    return  searchFiles(this.files, f => getLanguageFromFileName(f.name) === language, { multiple: true, type:"file" })
              .map(file=>({file, path:this.getFileObjPath(file.id).join("/")}));
  },
  procToFiles(callback) {
    searchFiles(this.files, callback, { multiple: true, type:"file" });
  },
  listAllFileObjects() {
    return [...this.files];
  },

  getFileObjPath(fobjId){
    const filesIdMap = new Map();
    for (const f of this.files) {
      filesIdMap.set(f.id, f);
    }
    let path = [];
    let next = this.findFileObjById(fobjId);
    while(next){
      path.unshift(next.name);
      next = filesIdMap.get(next.parent);
    }
    return path;
  },

  checkCanMove(toId, moveId){
    if(toId === moveId){
      return false;
    }
    if(toId === undefined) return true;

    const toFolder = this.findFileObjById(toId);
    //移動先がない、またはフォルダでない場合移動できない
    if(!toFolder){
      throw new Error("移動先がプロジェクト内に存在しません");
    }
    if(toFolder.type !== "folder"){
      throw new Error("移動先にフォルダ以外のものが指定されています");
    }

    const moveFileObj = this.findFileObjById(moveId);
    if(this.hasSameNameInFolder(toId, moveFileObj.name)){
      throw new Error("移動先のフォルダに同じ名前のファイル、またはフォルダがあるため移動できません");
    }

    if(moveFileObj.type === "folder" && this.containsFolder(moveId, toId)){
      throw new Error("移動先のフォルダが移動させようとしているフォルダの中にあるため移動できません");
    }

    return true;
  },

  deleteFile(file){
    const idx = this.files.findIndex(f=>f.id === file.id);
    if(idx < 0) {
      throw new Error(`指定のファイル（ID：${file.id}）がプロジェクト内にありません`);
    }
    let list = [file];
    this.files.splice(idx, 1);
    if(file.type === "folder"){
      const children = this.findChildren(file, "all");
      list = children.map(f=>this.deleteFile(f)).flat(Infinity);
    }
    return list;
  }
};

const newProject = (name) => {
  const index = newFile({ name: "index.html" });
  return setProto({
    id: createId(),
    name: name || `新規プロジェクト[${new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(Date.now())}]`,
    files: [index],
    opened: index.id,
    tabs: [index.id],
    entryFile: index.id,
    localStorage: [],
  }, proto);
};

const copyProject = (name, baseProject) => {
  const copied = JSON.parse(JSON.stringify(baseProject), (name, value) => {
    if(value?.type === "file"){
      return setProto(value, FileProto);
    }
    else if(value?.type === "folder"){
      return setProto(value, FolderProto);
    }
    return value;
  });
  Object.assign(copied, {
    id:createId(),
    name,
    localStorage:[],
  });
  return setProto(copied, proto);
};

const initialProjectId = createId();

const deserializer = (name, value) => {
  const patterns = [
    (name, value) => ({
      cond: typeof value !== "object",
      convert: () => value
    }),
    (name, value) => ({
      cond: typeof value?.entryFile === "string",
      convert: () => setProto(value, proto),
    }),
    (name, value) => ({
      cond: value.type === "file",
      convert: () => setProto(value, FileProto),
    }),
    (name, value) => ({
      cond: value.type === "folder",
      convert: () => setProto(value, FolderProto),
    }),
  ];
  for (const p of patterns) {
    const obj = p(name, value);
    if (obj.cond){
      return obj.convert();
    }
  }
  return value;
}

export {
  proto,
  newProject,
  copyProject,
  initialProjectId,
  deserializer,
}