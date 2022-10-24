export default (name, props={}) => {
  const elem = document.createElement(name);
  const listeners = [];
  const attrs = [];
  for(const [name, value] of Object.entries(props)){
    if(name.startsWith("@")){
      const eventName = name.slice(1);
      listeners.push([
        eventName,
        [value].flat(1),
      ]);
    }
    else{
      attrs[name] = value;
    }
  }
  Object.assign(elem, attrs);
  listeners.forEach(([eventName, evListeners])=>{
    console.log({eventName, evListeners})
    evListeners.forEach(listener=>elem.addEventListener(eventName, listener));
  });
  return elem;
}