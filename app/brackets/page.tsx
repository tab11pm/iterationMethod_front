// app/brackets/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
	ResponsiveContainer,
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ReferenceArea,
} from 'recharts'
import { normalizeExpr } from '@/utils/normalizeExpr'

type Interval = { a: number; b: number; fa: number; fb: number }

export default function BracketPage() {
	const [f, setF] = useState('3*x + cos(x)')
	const [xmin, setXmin] = useState(-10)
	const [xmax, setXmax] = useState(10)
	const [steps, setSteps] = useState(500)
	const [intervals, setIntervals] = useState<Interval[]>([])
	const [data, setData] = useState<{ x: number; y: number }[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function findBrackets() {
		setLoading(true)
		setError(null)
		setIntervals([])
		try {
			const body = {
				f: normalizeExpr(f),
				xmin,
				xmax,
				steps,
			}

			const r = await fetch('/api/brackets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			const data = await r.json()
			if (!r.ok) throw new Error(data?.error || 'Ошибка запроса')

			setIntervals(data.intervals || [])
			setData(data.samples || []) // если бэкенд возвращает точки для графика
		} catch (e: any) {
			setError(e.message || 'Ошибка сети')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<header className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-bold">Поиск интервалов с корнями</h1>
				</div>
				<button
					onClick={findBrackets}
					disabled={loading}
					className="rounded-2xl px-5 py-2 text-sm font-medium shadow-sm ring-1 ring-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
				>
					{loading ? 'Считаем…' : 'Найти интервалы'}
				</button>
			</header>

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<div className="space-y-1 md:col-span-2">
						<label className="text-xs text-neutral-500">f(x)</label>
						<input
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm font-mono"
							value={f}
							onChange={(e) => setF(e.target.value)}
							placeholder="например: 3*x + cos(x) = 0"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Xmin</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={xmin}
							onChange={(e) => setXmin(Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Xmax</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={xmax}
							onChange={(e) => setXmax(Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Шаги (steps)</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={steps}
							onChange={(e) => setSteps(Number(e.target.value))}
						/>
					</div>
				</div>
			</motion.div>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			)}

			{intervals.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
				>
					<div className="mb-2 text-sm font-medium">Найденные интервалы</div>
					<div className="overflow-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="border-b bg-neutral-50 text-neutral-600">
									<th className="px-3 py-2">№</th>
									<th className="px-3 py-2">a</th>
									<th className="px-3 py-2">b</th>
									<th className="px-3 py-2">f(a)</th>
									<th className="px-3 py-2">f(b)</th>
								</tr>
							</thead>
							<tbody>
								{intervals.map((intv, i) => (
									<tr key={i} className="border-b last:border-0">
										<td className="px-3 py-2">{i + 1}</td>
										<td className="px-3 py-2">{intv.a.toFixed(6)}</td>
										<td className="px-3 py-2">{intv.b.toFixed(6)}</td>
										<td className="px-3 py-2 font-mono">
											{intv.fa.toExponential(3)}
										</td>
										<td className="px-3 py-2 font-mono">
											{intv.fb.toExponential(3)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</motion.div>
			)}

			{data.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
				>
					<div className="mb-2 text-sm font-medium">График f(x)</div>
					<div className="h-80 w-full">
						<ResponsiveContainer>
							<LineChart data={data}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="x" />
								<YAxis />
								<Tooltip />
								<Line type="monotone" dataKey="y" stroke="#000" dot={false} />
								{intervals.map((intv, i) => (
									<ReferenceArea
										key={i}
										x1={intv.a}
										x2={intv.b}
										strokeOpacity={0.1}
										fill="#22c55e"
										fillOpacity={0.15}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
				</motion.div>
			)}
		</>
	)
}
