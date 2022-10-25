import { setProto } from "../libs/ModelUtil.js";
import { proto as FileProto } from "../Models/File.js";
import { proto as ProjectProto, newProject } from "../Models/Project.js";

const receiver = (name, value) => {
  const patterns = [
    (name, value) => ({
      cond: typeof value !== "object",
      convert: () => value
    }),
    (name, value) => ({
      cond: typeof value?.entryFile === "string",
      convert: () => setProto(value, ProjectProto),
    }),
    (name, value) => ({
      cond: value.type === "file",
      convert: () => setProto(value, FileProto),
    }),
  ];
  for (const p of patterns) {
    const obj = p(name, value);
    if (obj.cond){
      return obj.convert();
    }
  }
  return value;
}

export default {
  receiver,
  migrations:[
    {
      v: 0,
      up: () => {
        return [
          newProject("新規プロジェクト"),
        ];
      }
    }
  ],
};