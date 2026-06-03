import { createI18n } from 'vue-i18n'

import shared_en from '@/shared/locales/en.json'
import about_en from '@/features/about/locales/en.json'
import admin_en from '@/features/admin/locales/en.json'
import applications_en from '@/features/applications/locales/en.json'
import articles_en from '@/features/articles/locales/en.json'
import auth_en from '@/features/auth/locales/en.json'
import company_en from '@/features/company/locales/en.json'
import evaluation_en from '@/features/evaluation/locales/en.json'
import faq_en from '@/features/faq/locales/en.json'
import mentor_en from '@/features/mentor/locales/en.json'
import milestones_en from '@/features/milestones/locales/en.json'
import partners_en from '@/features/partners/locales/en.json'
import program_a_en from '@/features/program_a/locales/en.json'
import program_b_en from '@/features/program_b/locales/en.json'
import student_en from '@/features/student/locales/en.json'
import tasks_en from '@/features/tasks/locales/en.json'

import shared_sk from '@/shared/locales/sk.json'
import about_sk from '@/features/about/locales/sk.json'
import admin_sk from '@/features/admin/locales/sk.json'
import applications_sk from '@/features/applications/locales/sk.json'
import articles_sk from '@/features/articles/locales/sk.json'
import auth_sk from '@/features/auth/locales/sk.json'
import company_sk from '@/features/company/locales/sk.json'
import evaluation_sk from '@/features/evaluation/locales/sk.json'
import faq_sk from '@/features/faq/locales/sk.json'
import mentor_sk from '@/features/mentor/locales/sk.json'
import milestones_sk from '@/features/milestones/locales/sk.json'
import partners_sk from '@/features/partners/locales/sk.json'
import program_a_sk from '@/features/program_a/locales/sk.json'
import program_b_sk from '@/features/program_b/locales/sk.json'
import student_sk from '@/features/student/locales/sk.json'
import tasks_sk from '@/features/tasks/locales/sk.json'


const browserLocale = typeof window !== 'undefined'
  ? window.localStorage.getItem('locale')
  : null

export const i18n = createI18n({
  legacy: false,
  locale: browserLocale === 'sk' ? 'sk' : 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      ...shared_en,
      ...about_en,
      ...admin_en,
      ...applications_en,
      ...articles_en,
      ...auth_en,
      ...company_en,
      ...evaluation_en,
      ...faq_en,
      ...mentor_en,
      ...milestones_en,
      ...partners_en,
      ...program_a_en,
      ...program_b_en,
      ...student_en,
      ...tasks_en,
    },
    sk: {
      ...shared_sk,
      ...about_sk,
      ...applications_sk,
      ...admin_sk,
      ...articles_sk,
      ...auth_sk,
      ...company_sk,
      ...evaluation_sk,
      ...faq_sk,
      ...mentor_sk,
      ...milestones_sk,
      ...partners_sk,
      ...program_a_sk,
      ...program_b_sk,
      ...student_sk,
      ...tasks_sk,
    },
  },
})