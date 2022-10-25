import {proto as Project, newProject} from "../Models/Project.js";
import { createId, setProto } from "./ModelUtil.js";

//ほぼほぼ重複しないIDを生成
const initialProjectId = createId();

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
        return setProto(value, Project);
      }
      if (value.type === "file") {
        return setProto(value, {
          get stringValue() {
            return binaryString2String(this.value);
          },
          set stringValue(val) {
            this.value = string2BinaryString(val);
          },
          get dataURI() {
            return binaryString2DataURI(this.value, getMimeTypeFromFileName(this.name))
          },
        });
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

export default Store;