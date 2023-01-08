import { setProto } from "../libs/ModelUtil.js";
import { proto as FileProto } from "../Models/v1/File.js";
import { proto as ProjectProto, newProject, deserializer } from "../Models/v1/Project.js";

export default {
  migrations:[
    {
      v: 0,
      up: () => {
        return [
          newProject("新規プロジェクト"),
        ];
      },
      deserializer,
    },
    {
      v: 1,
      up: projects => {
        return projects.map(project=>{
          project.localStorage = [];
          return project;
        });
      },
      deserializer,
    },
  ],
};