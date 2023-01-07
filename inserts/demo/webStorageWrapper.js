export default {
  insertData:(project) => {
    return {project:project.id, data:project.localStorage};
  },
  onProcess:(storageContext) => {
    const createStorage = (data, { set=()=>{}, clear=()=>{}, remove=()=>{} }={}) => {
      const storage = new Map(data);
      return Object.assign(Object.create(null), {
        key:n=>[...storage.keys()][n],
        getItem:name=>storage.has(name)?storage.get(name):null,
        setItem:(name, value)=>{
          storage.set(name,value+"");
          set(name, value);
        },
        removeItem:(key)=>{
          storage.delete(key);
          remove(key);
        },
        clear:()=>{
          storage.clear();
          clear();
        },
      });
    }
    Object.defineProperty(window, "sessionStorage", {
      value:createStorage(),
    });
    const sendMessage = (detail) => {
      parent.postMessage({action:"localStorage", project:storageContext.project, detail}, "*");
    }
    Object.defineProperty(window, "localStorage", {
      value:createStorage(storageContext.data, {
        set(name, value){
          sendMessage({action:"set", args:[name, value]});
        },
        remove(name){
          sendMessage({action:"remove", args:[name]});
        },
        clear(){
          sendMessage({action:"clear", args:[]});
        }
      }),
    });
  }
}