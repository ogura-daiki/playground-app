import { setProto, createId } from "../libs/ModelUtil.js";
import { newFile } from "./File.js";

const searchFiles = (files, callback, { type = "file", multiple = false, path = "" } = {}) => {
  const value = [];
  const walk = (files, path) => {
    return files.some(file => {
      if (type === "all" || file.type === type) {
        const result = callback(file);
        if (result) {
          value.push({ file, path: path + file.name });
          return multiple;
        }
      }
      if (file.type == "folder") {
        return walk(file.files, path + file.name + "/") && multiple;
      }
    })
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
  }, proto);
};

const initialProjectId = createId();

export {
  proto,
  newProject,
  initialProjectId,
}