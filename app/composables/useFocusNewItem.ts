type Kind = 'list' | 'template'

export function useFocusNewItem() {
  const items = useState<Set<string>>('listomat:focusNewItems', () => new Set())

  function key(kind: Kind, id: string) {
    return `${kind}:${id}`
  }

  function mark(kind: Kind, id: string) {
    if (!id) return
    const next = new Set(items.value)
    next.add(key(kind, id))
    items.value = next
  }

  function consume(kind: Kind, id: string): boolean {
    const k = key(kind, id)
    if (!items.value.has(k)) return false
    const next = new Set(items.value)
    next.delete(k)
    items.value = next
    return true
  }

  function focusAndSelect(el: HTMLElement | null | undefined) {
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  return { mark, consume, focusAndSelect }
}
