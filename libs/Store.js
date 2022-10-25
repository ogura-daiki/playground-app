
const projectProto = {
  __searchFiles(files, callback, { type = "file", multiple = false, path = "" } = {}) {
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
  },
  findFileById(id) {
    return this.__searchFiles(this.files, file => file.id === id)?.file;
  },
  findFileObjFromId(id) {
    return this.__searchFiles(this.files, f => f.id === id, { type: "all" })?.file;
  },
  findParentByFileId(id) {
    if (this.files.some(f => f.id === id)) return this.files;
    return this.__searchFiles(this.files, folder => {
      return folder.files.some(file => file.id === id);
    }, { type: "folder" })?.file.files;
  },
  hasRefLoop(toFiles, file) {
    if (file.type !== "folder") return false;
    if (file.files === toFiles) return true;
    return !!this.__searchFiles(file.files, f => f.files === toFiles, { type: "folder" });
  },
  hasEntryFile(folder) {
    if (folder.type != "folder") return false;
    return !!this.__searchFiles(folder.files, f => f.id === this.entryFile);
  },
  getOpenedFile() {
    return this.findFileById(this.opened);
  },
  findFilesByLanguage(language) {
    return this.__searchFiles(this.files, f => getLanguageFromFileName(f.name) === language, { multiple: true });
  },
  procToFiles(callback) {
    this.__searchFiles(this.files, callback, { multiple: true });
  }
};

//ほぼほぼ重複しないIDを生成
const createId = () => `${Date.now()}-${crypto.randomUUID()}`;
const initialProjectId = createId();

const createFile = ({ name, value = "" }) => ({ id: createId(), type: "file", name, value });
const createFolder = ({ name, files = [] }) => ({ id: createId(), type: "folder", name, files });

const newProject = (name) => {
  const index = createFile({ name: "index.html" });
  return {
    id: createId(),
    name: name || `新規プロジェクト[${new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(Date.now())}]`,
    files: [index],
    opened: index.id,
    tabs: [index.id],
    entryFile: index.id,
  }
};

const Models = {
  "config": {
    migrations: [
      {
        v: 0,
        up: () => {
          return {
            layout: 1,
            refresh_wait: 1000,
            auto_refresh: false,
          };
        }
      },
    ],
  },
  "ctx": {
    migrations: [
      {
        v: 0,
        up: () => {
          return {
            value: "",
          }
        }
      },
      {
        v: 1,
        up: () => {
          return {
            project: initialProjectId,
          }
        }
      },
    ],
  },
  "projects": {
    migrations: [
      {
        v: 0,
        up: () => {
          return [
            newProject("新規プロジェクト"),
          ];
        }
      },
    ],
    receiver: (name, value) => {
      if (typeof value !== 'object') return value;
      console.log({ value })
      if (typeof value?.entryFile === "string") {
        return Object.assign(Object.create(projectProto), value);
      }
      if (value.type === "file") {
        return Object.assign(Object.create({
          get stringValue() {
            return binaryString2String(this.value);
          },
          set stringValue(val) {
            this.value = string2BinaryString(val);
          },
          get dataURI() {
            return binaryString2DataURI(this.value, getMimeTypeFromFileName(this.name))
          },
        }), value);
      }
      return value;
    }
  },
}

const store = {
  get(key, receiver = ((n, v) => v)) {
    return JSON.parse(localStorage.getItem(key) || "{}", receiver);
  },
  set(key, value) {
    return localStorage.setItem(key, JSON.stringify(value));
  },
};

const migrate = (key, obj, migrations) => {
  //現在のバージョンを取得
  const version = store.get("version-" + key);
  //実施する必要のあるmigrationを取得
  let current = -1;
  if (typeof version === "number") {
    current = migrations.findIndex(m => m.v === version);
    if (current === -1) throw new Error(`migration missing. current:${version}`);
  }
  const migrationList = migrations.slice(current + 1);


  //実施すべきmigrationが無い場合は最新の状態になっているのでそのまま返す。
  if (migrationList.length === 0) return obj;

  console.log({ migrationList: migrationList.map(m => m.up + "") })

  //migrationを実施
  const migrated = migrationList.reduce((obj, m) => m.up(obj), obj);

  //一番最後のmigrationのバージョンを保存
  const lastMigration = migrationList.pop();
  store.set("version-" + key, lastMigration.v);
  setValue(key, migrated);

  return migrated;
}

const getValue = key => {
  const model = Models[key];
  //保存されている内容を取得
  let obj = store.get("store-" + key);
  obj = migrate(key, obj, model.migrations);
  store.set("store-" + key, obj);
  console.log({ key, obj }, store.get("store-" + key, model.receiver))
  return store.get("store-" + key, model.receiver);
}

const setValue = (key, obj) => {
  store.set("store-" + key, obj);
}

const Store = Object.freeze(Object.assign(Object.create(null), {
  get: getValue, set: setValue,
}));

export {Store, createId, createFile, createFolder, newProject};