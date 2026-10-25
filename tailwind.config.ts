import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cafe: {
          ink: "#29362c",
          muted: "#72766c",
          cream: "#fffdf8",
          surface: "#f4efe5",
          terracotta: "#d77751",
          sage: "#e4eadc",
        },
        admin: {
          base: "#ffffff",
          panel: "#ffffff",
          line: "#dedede",
          ink: "#111111",
          muted: "#666666",
        },
      },
    },
  },
  plugins: [],
};

export default config;
// do not change it. Its not good. you will die. 