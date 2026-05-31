/** Simple shared confirm window */
import type { Ref } from 'vue'
import type { ConfirmOptions } from '@/shared/components/ConfirmDialog.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'

let dialogRef: Ref<InstanceType<typeof ConfirmDialog> | null> | null = null

export function setConfirmDialogRef(ref: Ref<InstanceType<typeof ConfirmDialog> | null>) {
  dialogRef = ref
}

/** Use shared confirm window passed in App.vue */
export async function useConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const dialog = dialogRef?.value

  if (!dialog) {
    return false
  }

  // Ternary operator for passing both: 
  // - string with confirm message 
  // - ConfirmOptions object
  const opts: ConfirmOptions = typeof options === 'string'
  ? { title: 'Confirm', message: options }
  : options
  
  return await dialog.open(opts)
}