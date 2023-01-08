import { setProto, createId } from "../../libs/ModelUtil.js";
import { FileProto, FolderProto, newFile } from "./File.js";

const searchFiles = (files, callback, { type = "file", multiple = false, path = "" } = {}) => {
  const value = [];
  const walk = (files, path) => {
    return files.some(file => {
      if (type === "all" || file.type === type) {
        const result = callback(file);
        if (result) {
          value.push({ file, path: path + file.name });
          if(type === "file"){
            return !multiple;
          }
        }
      }
      if (file.type == "folder") {
        return walk(file.files, path + file.name + "/");
      }
    });
  }
  walk(files, path);
  if (multiple) {
    return value;
  }
  return value[0];
};

const proto = {
  findFileById(id) {
    return searchFiles(this.files, file => file.id === id)?.file;
  },
  findFileObjFromId(id) {
    return searchFiles(this.files, f => f.id === id, { type: "all" })?.file;
  },
  findParentByFileId(id) {
    if (this.files.some(f => f.id === id)) return this.files;
    return searchFiles(this.files, folder => {
      return folder.files.some(file => file.id === id);
    }, { type: "folder" })?.file.files;
  },
  hasRefLoop(toFiles, file) {
    if (file.type !== "folder") return false;
    if (file.files === toFiles) return true;
    return !!searchFiles(file.files, f => f.files === toFiles, { type: "folder" });
  },
  hasEntryFile(folder) {
    if (folder.type != "folder") return false;
    return !!searchFiles(folder.files, f => f.id === this.entryFile);
  },
  getOpenedFile() {
    return this.findFileById(this.opened);
  },
  findFilesByLanguage(language) {
    return searchFiles(this.files, f => getLanguageFromFileName(f.name) === language, { multiple: true });
  },
  procToFiles(callback) {
    searchFiles(this.files, callback, { multiple: true });
  },
  listAllFileObjects() {
    return searchFiles(this.files, ()=>true, { type:"all", multiple: true }).map(o=>o.file);
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