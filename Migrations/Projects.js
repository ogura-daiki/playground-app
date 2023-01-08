import * as v1 from "../Models/v1/Project.js";
import * as v2 from "../Models/v2/Project.js";

export default {
  migrations:[
    {
      v: 0,
      up: () => {
        return [
          v1.newProject("新規プロジェクト"),
        ];
      },
      deserializer:v1.deserializer,
    },
    {
      v: 1,
      up: projects => {
        return projects.map(project=>{
          project.localStorage = [];
          return project;
        });
      },
      deserializer:v1.deserializer,
    },
    {
      v: 2,
      up: projects => {
        return projects.map(project=>{
          let list = project.listAllFileObjects();
          list = list.map(file=>{
            file.parent = undefined;
            return file;
          });
          list = list.map(file=>{
            console.log(file);
            if(file.type === "folder"){
              for(const child of file.files){
                child.parent = file.id;
              }
              delete file.files;
            }
            return file;
          });
          console.log(list);
          project.files = list;
          return project;
        });
      },
      deserializer:v2.deserializer,
    },
  ],
};