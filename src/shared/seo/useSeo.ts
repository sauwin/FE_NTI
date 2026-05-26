import { useHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import { seoMap } from './seoMap'

export function useSeo() {
  const route = useRoute()

  const seo = seoMap[route.path] ?? {
    title: 'NTI',
    description: 'NTI platform',
  }

  useHead({
    title: seo.title,
    meta: [
      {
        name: 'description',
        content: seo.description,
      },
    ],
  })
}