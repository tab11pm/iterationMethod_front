export type CompareRes = {
	method: string
	iters: number
	converged: boolean
	root: number
}

export type FixedSuggestRes = {
	suggest: number
	lo: number
	hi: number
}
