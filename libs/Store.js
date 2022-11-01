
class Store {
  #store;
  constructor(store){
    this.#store = store;
  }
  get(key){
    const model = this.constructor.Models[key];
    //保存されている内容を取得
    let obj = this.#store.get("store-" + key);
    obj = this.#migrate(key, obj, model.migrations);
    this.#store.set("store-" + key, obj);
    return this.#store.get("store-" + key, model.receiver);
  }
  set(key, value){
    this.#store.set(key, value);
  }

  #migrate(key, obj, migrations) {
    //現在のバージョンを取得
    const version = this.#store.get("version-" + key);
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
    this.#store.set("version-" + key, lastMigration.v);
    this.set(key, migrated);
  
    return migrated;
  }
}

export default Store;