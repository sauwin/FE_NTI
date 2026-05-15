import { ref } from 'vue'
import type { ConfirmOptions } from '@/components/ConfirmDialog.vue'

let dialogRef: any = null

export function setConfirmDialogRef(ref: any) {
dialogRef = ref
}

export async function useConfirm(options: ConfirmOptions | string): Promise<boolean> {
if (!dialogRef) {
console.warn('ConfirmDialog not initialized')
return false
}

const opts: ConfirmOptions = typeof options === 'string'
? { title: 'Confirm', message: options }
: options

return await dialogRef.value.open(opts)
}