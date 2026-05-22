# be_nti

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

This repository contains two folders:

- `BE_NTI` — Laravel backend
- `FE_NTI` — Vue 3 frontend

### Frontend setup

```sh
cd FE_NTI
npm install
npm run dev
```

### Backend setup

```sh
cd BE_NTI
composer install
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

The frontend expects the backend API at `http://localhost:8000/api`.

### Compile and Hot-Reload for Development

```sh
cd FE_NTI
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
cd FE_NTI
npm run build
```
