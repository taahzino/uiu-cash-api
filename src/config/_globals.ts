// @ts-nocheck
import path from "path";
import getAppIP from "./_ip";

const _globals: {
  [prop: string]: any;
} = (() => {
  const PUBLIC_DIR = path.join(__dirname, "../../public");

  return {
    MODE: process.env.MODE,
    PORT: process.env.PORT,

    BASE_URL: (() => {
      if (process.env.MODE === "development") {
        return `http://${getAppIP()}:${process.env.PORT}`;
      } else {
        return process.env.BASE_URL;
      }
    })(),

    ONE_MIN: 1000 * 60,
    ONE_HOUR: global.ONE_MIN * 60,
    ONE_DAY: global.ONE_HOUR * 24,

    PUBLIC_DIR,
    FOLDERS: [PUBLIC_DIR],
  };
})();

export default _globals;
