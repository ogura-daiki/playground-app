import {setProto, createId} from "../../libs/ModelUtil.js";

const getTypeString = type => Object.assign(Object.create(null), {folder:"フォルダ",file:"ファイル"})[type];

const FileProto = {
  get stringValue() {
    return binaryString2String(this.value);
  },
  set stringValue(val) {
    this.value = string2BinaryString(val);
  },
  get dataURI() {
    return binaryString2DataURI(this.value, getMimeTypeFromFileName(this.name))
  },
  get typeString(){
    return getTypeString(this.type);
  }
}

const FolderProto = {
  get typeString(){
    return getTypeString(this.type);
  }
}

const newFile = ({ name, value = "", parent }) => setProto({ id: createId(), type:"file", name, value, parent }, FileProto);
const newFolder = ({ name, parent}) => setProto({ id: createId(), type: "folder", name, parent }, FolderProto);

export {
  FileProto,
  FolderProto,
  newFile,
  newFolder,
};