const createId = () => `${Date.now()}-${crypto.randomUUID()}`;
const setProto = (obj, proto) => Object.assign(Object.create(proto), obj);
export {createId, setProto};