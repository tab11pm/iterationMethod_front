import { CompareReq } from '@/types/compare.types'
import { CompareRes, FixedSuggestRes } from '@/types/response.types'
import { RootMethod } from '@/types/root.types'

class CompareService {
	async Compare(
		methods: RootMethod[],
		data: Omit<CompareReq, 'methods'>
	): Promise<CompareRes[]> {
		const body: CompareReq = {
			methods,
			...data,
		}
		const r = await fetch('/api/compare', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		return await r.json()
	}

	async FixedSuggest(body: {
		f: string
		x0: number
	}): Promise<FixedSuggestRes> {
		if (body.f.length < 1 && body.x0 < 1)
			throw Error('Заполните функцию и началную точку')
		const response = await fetch('api/fixed-suggest', {
			method: 'POST',
			body: JSON.stringify(body),
		})
		return response.json()
	}
}

export const compareService = new CompareService()
