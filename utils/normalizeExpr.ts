// Нормализация уравнений: "A=B" -> "(A)-(B)"; иначе — как есть
export function normalizeExpr(input: string): string {
	const s = (input ?? '').trim()
	const i = s.indexOf('=')
	if (i === -1) return s
	const left = s.slice(0, i).trim()
	const right = s.slice(i + 1).trim()
	if (!left || !right) return s
	return `(${left})-(${right})`
}
