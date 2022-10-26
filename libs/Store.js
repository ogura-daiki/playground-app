import Models from "../Migrations/index.js";

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
  return store.get("store-" + key, model.receiver);
}

const setValue = (key, obj) => {
  store.set("store-" + key, obj);
}

const Store = Object.freeze(Object.assign(Object.create(null), {
  get: getValue, set: setValue,
}));

export default Store;