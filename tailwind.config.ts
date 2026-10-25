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
          base: "#0d1117",
          panel: "#161b22",
          line: "#30363d",
          blue: "#0051ff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
