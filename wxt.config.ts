import { enhancedImages } from "@sveltejs/enhanced-img";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "GestureNav",
    permissions: ["storage"],
    action: {},
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
  },
  srcDir: "src",
  vite: () => ({
    plugins: [
      enhancedImages(),
      svelte({
        configFile: false,
        preprocess: [vitePreprocess()],
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/@mediapipe/tasks-vision/wasm",
            dest: "assets",
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
  }),
});
