// Run: bun add -d babel-plugin-module-resolver
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@modules": "./modules",
            "@shared": "./shared",
            "@core": "./core",
          },
        },
      ],
    ],
  };
};
