// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxtjs/tailwindcss"],
  compatibilityDate: '2025-09-15',
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0' }
      ]
    }
  },
  devServer: {
    port: 3322,
    host: '0.0.0.0',
  },
  vite: {
    logLevel: 'error'
  }
});
