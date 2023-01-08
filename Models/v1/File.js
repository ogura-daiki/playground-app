import {setProto, createId} from "../../libs/ModelUtil.js";

const proto = {
  get stringValue() {
    return binaryString2String(this.value);
  },
  set stringValue(val) {
    this.value = string2BinaryString(val);
  },
  get dataURI() {
    return binaryString2DataURI(this.value, getMimeTypeFromFileName(this.name))
  },
}

const newFile = ({ name, value = "" }) => setProto({ id: createId(), type:"file", name, value }, proto);
const newFolder = ({ name, files = [] }) => ({ id: createId(), type: "folder", name, files });

export {
  proto,
  newFile,
  newFolder,
};