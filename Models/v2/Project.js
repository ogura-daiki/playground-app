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
  contains(parentFolder, fobj){
    if (parentFolder.type !== "folder") return false;
    const filesIdMap = new Map();
    for (const f of this.files) {
      filesIdMap.set(f.id, f);
    }
    let next = fobj;
    do{
      if(next.id === parentFolder.id){
        return true;
      }
      next = filesIdMap.get(next.parent);
    } while(next);
    return false;
  },
  hasEntryFile(parentFolder) {
    this.contains(parentFolder, this.findFileById(this.entryFile));
  },
  getOpenedFile() {
    return this.findFileById(this.opened);
  },
  findFilesByLanguage(language) {
    return searchFiles(this.files, f => getLanguageFromFileName(f.name) === language, { multiple: true, type:"file" });
  },
  procToFiles(callback) {
    searchFiles(this.files, callback, { multiple: true, type:"file" });
  },
  listAllFileObjects() {
    return [...this.files];
  },
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