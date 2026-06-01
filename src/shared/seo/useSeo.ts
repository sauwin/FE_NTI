import { useHead } from '@vueuse/head'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { seoMap } from './seoMap'

/**
 * Add title and description metadata to head component of the file
 */
export function useSeo() {
  const route = useRoute()

  const seo = computed(
    () =>
      seoMap[route.path] ?? {
        title: 'NTI',
        description: 'NTI platform',
      },
  )

  useHead(() => ({
    title: seo.value.title,
    meta: [
      {
        name: 'description',
        content: seo.value.description,
      },
    ],
  }))
}