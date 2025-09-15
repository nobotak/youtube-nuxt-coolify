// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  compatibilityDate: '2025-09-15',
  devServer: {
    port: 3322,
    host: '0.0.0.0',
  },
  vite: {
    logLevel: 'error'
  }
});
