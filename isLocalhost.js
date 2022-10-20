const isLocalhost = (()=>{
  const list = new Set([
    "localhost",
    "127.0.0.1",
  ]);
  return list.has(location.hostname);
})()