import { initialProjectId } from "../Models/Project.js";

export default {
  migrations: [
    {
      v: 0,
      up: () => {
        return {
          value: "",
        }
      }
    },
    {
      v: 1,
      up: () => {
        return {
          project: initialProjectId,
        }
      }
    },
  ],
}