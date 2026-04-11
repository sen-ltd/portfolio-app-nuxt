// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  app: {
    baseURL: '/portfolio/portfolio-app-nuxt/',
  },
  css: ['~/src/style.css'],
  nitro: {
    output: {
      dir: 'dist',
    },
  },
})
