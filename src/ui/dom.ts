/** 小さな DOM 構築ヘルパー(フレームワーク不使用) */

export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

export const button = (
  className: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement => {
  const node = el('button', className, label)
  node.type = 'button'
  node.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick()
  })
  return node
}

export const clear = (node: HTMLElement): void => {
  while (node.firstChild) node.removeChild(node.firstChild)
}

export const show = (node: HTMLElement, visible: boolean): void => {
  node.classList.toggle('hidden', !visible)
}
