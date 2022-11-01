import Store from "./Store.js";
import Models from "../Migrations/index.js";

const store = {
  get(key, receiver = ((n, v) => v)) {
    return JSON.parse(localStorage.getItem(key) || "{}", receiver);
  },
  set(key, value) {
    return localStorage.setItem(key, JSON.stringify(value));
  },
};


class LocalStorageStore extends Store{
  constructor(){
    super(store);
  }
  static Models = Models;
}

export default LocalStorageStore;