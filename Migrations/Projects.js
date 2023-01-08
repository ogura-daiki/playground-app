import { newProject, deserializer } from "../Models/v1/Project.js";

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