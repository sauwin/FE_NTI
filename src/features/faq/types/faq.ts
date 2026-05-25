export interface FaqItem {
  id: number
  page_context: string
  order_position: number
  is_active: boolean
  question: string
  answer: string
}

export interface FaqItemPayload {
  page_context: string
  question: string
  answer: string
  is_active: boolean
  order_position: number
}
