'use client'

import Container from '@/components/ui/Container'
import Header from '@/components/ui/Header'
import Input from '@/components/ui/Input'
import { compareService } from '@/services/compare.service'
import { FixedSuggestRes } from '@/types/response.types'
import { useState } from 'react'

export default function Test() {
	const [value, setValue] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const [suggest, setSuggest] = useState<FixedSuggestRes | null>(null)
	const handleGetFixedSuggest = async () => {
		try {
			setLoading(true)
			const response = await compareService.FixedSuggest({ f: value, x0: 1 })
			console.log(response)
			setSuggest(response)
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value)
	}

	return (
		<>
			<Header
				loading={loading}
				onClick={handleGetFixedSuggest}
				title="Найти подходящую началную точку"
			/>
			<Container className="grid grid-cols-1 md:grid-cols-2 gap-2">
				<Input type="text" label="f(x)" value={value} onChange={handleChange} />
				<Input label="x" value={value} onChange={handleChange} />
			</Container>

			{suggest && (
				<p className="text-xs text-neutral-500">
					Подсказка: <span className="font-mono">{value}</span> хорошо работает
					при <span className="font-mono">x₀={suggest.suggest}</span>; при
					<span className="font-mono">
						{' '}
						x₀ {'<'} {suggest.lo} и x₀ {'>'} {suggest.hi}{' '}
					</span>
					функция расходится
				</p>
			)}
		</>
	)
}
