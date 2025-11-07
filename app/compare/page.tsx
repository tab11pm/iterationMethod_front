'use client'

// app/compare/page.tsx
import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from 'recharts'
import { normalizeExpr } from '@/utils/normalizeExpr'

type RootMethod = 'bisection' | 'secant' | 'newton' | 'fixed'

type CompareItem = {
	method: RootMethod
	iters: number
	converged: boolean
	root: number
}

type CompareReq = {
	methods: RootMethod[]
	f: string
	g: string
	x0: number
	x1: number
	tol: number
	maxIter: number
}

type FixedCheckResp = { maxAbsGPrime: number; contractive: boolean }

function pretty(num: number, digits = 8) {
	if (Number.isNaN(num) || !Number.isFinite(num)) return String(num)
	return Number(num).toExponential(digits)
}

const ALL_METHODS: { value: RootMethod; label: string }[] = [
	// { value: 'bisection', label: 'Bisection' },
	// { value: 'secant', label: 'Secant' },
	{ value: 'newton', label: 'Newton' },
	{ value: 'fixed', label: 'Fixed-Point' },
]

export default function ComparePage() {
	const [methods, setMethods] = useState<RootMethod[]>(['fixed'])
	const [f, setF] = useState('cos(x)-x')
	const [g, setG] = useState('cos(x)')
	const [x0, setX0] = useState(1)
	const [x1, setX1] = useState(0) // для бисекции/секущих
	const [tol, setTol] = useState(1e-8)
	const [maxIter, setMaxIter] = useState(200)

	// Автогенерация g(x) = x - α f(x)
	const [autoG, setAutoG] = useState(true)
	const [alpha, setAlpha] = useState(1)
	const [checkInterval, setCheckInterval] = useState({
		a: 0,
		b: 1,
		samples: 300,
	})
	const [check, setCheck] = useState<FixedCheckResp | null>(null)

	const [loading, setLoading] = useState(false)
	const [rows, setRows] = useState<CompareItem[]>([])
	const [error, setError] = useState<string | null>(null)

	function buildGExpr(): string {
		if (!methods.includes('fixed')) return ''
		if (autoG) return `(x)-(${alpha})*(${f})`
		return g
	}

	async function runCheck(gExpr: string) {
		try {
			const gNorm = normalizeExpr(gExpr) // если есть '=', превращаем в "(A)-(B)"
			const r = await fetch('/api/fixed-check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					g: gNorm,
					a: checkInterval.a,
					b: checkInterval.b,
					samples: checkInterval.samples,
				}),
			})

			const data: FixedCheckResp = await r.json()
			if (!r.ok) throw new Error((data as any)?.error || 'check failed')
			setCheck(data)
		} catch (e: any) {
			setCheck(null)
			setError(e.message || 'Ошибка проверки сходимости')
		}
	}

	async function runCompare() {
		setLoading(true)
		setError(null)
		setRows([])
		setCheck(null)
		try {
			const gExpr = buildGExpr()
			if (methods.includes('fixed') && gExpr.trim() === '') {
				throw new Error(
					'Для Fixed-Point укажите g(x) или включите автогенерацию'
				)
			}

			// Предварительная проверка contractive для fixed-point (необязательная, но полезная)
			if (methods.includes('fixed')) {
				await runCheck(gExpr)
			}

			const body: CompareReq = {
				methods,
				f: normalizeExpr(f),
				g: normalizeExpr(gExpr),
				x0,
				x1,
				tol,
				maxIter,
			}
			const r = await fetch('/api/compare', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			const data = await r.json()
			if (!r.ok) throw new Error(data?.error || 'Ошибка сравнения')
			setRows(data as CompareItem[])
		} catch (e: any) {
			setError(e.message || 'Ошибка сети')
		} finally {
			setLoading(false)
		}
	}

	const chartData = useMemo(
		() => rows.map((r) => ({ method: r.method, iters: r.iters })),
		[rows]
	)

	return (
		<>
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Сравнение методов</h1>
				</div>
				<button
					onClick={runCompare}
					disabled={loading}
					className="rounded-2xl px-5 py-2 text-sm font-medium shadow-sm ring-1 ring-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
				>
					{loading ? 'Считаем…' : 'Сравнить'}
				</button>
			</header>

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Методы</label>
						<div className="flex flex-wrap gap-2">
							{ALL_METHODS.map((m) => (
								<label
									key={m.value}
									className={`cursor-pointer select-none rounded-xl border px-3 py-1 text-sm ${
										methods.includes(m.value)
											? 'bg-neutral-100 '
											: 'border-neutral-300'
									}`}
								>
									<input
										type="checkbox"
										className="mr-2"
										checked={methods.includes(m.value)}
										onChange={(e) =>
											setMethods((prev) =>
												e.target.checked
													? [...prev, m.value]
													: prev.filter((v) => v !== m.value)
											)
										}
									/>
									{m.label}
								</label>
							))}
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Точность (tol)</label>
						<input
							type="number"
							step="any"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={tol}
							onChange={(e) => setTol(Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">f(x)</label>
						<input
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm font-mono"
							value={f}
							onChange={(e) => setF(e.target.value)}
							placeholder="например: cos(x)-x"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">x₀</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={x0}
							onChange={(e) => setX0(Number(e.target.value))}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">
							x₁ (для bisection/secant)
						</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={x1}
							onChange={(e) => setX1(Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">maxIter</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={maxIter}
							onChange={(e) => setMaxIter(Number(e.target.value))}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">
							g(x) для Fixed-Point
						</label>
						<input
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm font-mono"
							value={autoG ? `(x)-(${alpha})*(${f})` : g}
							onChange={(e) => {
								setG(e.target.value)
								setAutoG(false)
							}}
							placeholder="например: cos(x)"
						/>
						<div className="text-xs text-neutral-500 mt-1 flex items-center gap-3">
							<label className="inline-flex items-center gap-2">
								<input
									type="checkbox"
									checked={autoG}
									onChange={(e) => setAutoG(e.target.checked)}
								/>{' '}
								Авто: g(x)=x−α·f(x)
							</label>
							<span>α</span>
							<input
								type="number"
								step="any"
								value={alpha}
								onChange={(e) => setAlpha(Number(e.target.value))}
								className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
							/>
						</div>
						<div className="text-xs text-neutral-400 mt-1">
							Совет: проверьте контрактность ниже (max |g'(x)| &lt; 1).
						</div>
					</div>
				</div>

				{methods.includes('fixed') && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-1">
							<label className="text-xs text-neutral-500">
								Интервал проверки a
							</label>
							<input
								type="number"
								className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
								value={checkInterval.a}
								onChange={(e) =>
									setCheckInterval((v) => ({
										...v,
										a: Number(e.target.value),
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-neutral-500">b</label>
							<input
								type="number"
								className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
								value={checkInterval.b}
								onChange={(e) =>
									setCheckInterval((v) => ({
										...v,
										b: Number(e.target.value),
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-neutral-500">samples</label>
							<input
								type="number"
								className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
								value={checkInterval.samples}
								onChange={(e) =>
									setCheckInterval((v) => ({
										...v,
										samples: Number(e.target.value),
									}))
								}
							/>
						</div>
						{check && (
							<div className="md:col-span-3 text-xs">
								Проверка: max |g'(x)| = <b>{check.maxAbsGPrime.toFixed(6)}</b> →{' '}
								{check.contractive ? (
									<span className="text-green-700">contractive</span>
								) : (
									<span className="text-amber-700">not contractive</span>
								)}
							</div>
						)}
					</div>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="space-y-4"
			>
				{error && (
					<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{error}
					</div>
				)}

				{rows.length > 0 && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:col-span-2">
							<div className="mb-2 text-sm font-medium">
								Итерации по методам
							</div>
							<div className="h-60 w-full">
								<ResponsiveContainer>
									<BarChart
										data={chartData}
										margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="method" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Legend />
										<Bar dataKey="iters" name="Итерации" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
							<div className="mb-2 text-sm font-medium">Сводка</div>
							<ul className="text-sm list-disc pl-5 space-y-1">
								{rows.map((r) => (
									<li key={r.method}>
										<b>{r.method}</b>: iters={r.iters}, root=
										<span className="font-mono">{pretty(r.root)}</span>,{' '}
										{r.converged ? 'converged' : 'no conv'}
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:col-span-3">
							<div className="mb-2 text-sm font-medium">
								Таблица результатов
							</div>
							<div className="overflow-auto">
								<table className="min-w-full text-left text-sm">
									<thead>
										<tr className="border-b bg-neutral-50 text-neutral-600">
											<th className="px-3 py-2">Метод</th>
											<th className="px-3 py-2">Итерации</th>
											<th className="px-3 py-2">Корень</th>
											<th className="px-3 py-2">Статус</th>
										</tr>
									</thead>
									<tbody>
										{rows.map((r) => (
											<tr key={r.method} className="border-b last:border-0">
												<td className="px-3 py-2">{r.method}</td>
												<td className="px-3 py-2">{r.iters}</td>
												<td className="px-3 py-2 font-mono">
													{pretty(r.root)}
												</td>
												<td className="px-3 py-2">
													{r.converged ? 'Converged' : 'Not converged'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{rows.length === 0 && !error && (
					<div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
						Выберите методы, задайте параметры и нажмите «Сравнить». Для
						Fixed-Point можно оставить автогенерацию g(x)=x−α·f(x); проверьте
						контрактность на интервале.
					</div>
				)}
			</motion.div>
		</>
	)
}
