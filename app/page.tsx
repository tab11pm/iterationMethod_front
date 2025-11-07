'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from 'recharts'
import { normalizeExpr } from '@/utils/normalizeExpr'

// Страница Next.js для решения корней двумя методами: Ньютона и простой итерации.
// Ожидает бэкенд Gin с эндпоинтом POST /api/v1/root/solve
// Формат запроса соответствует types.RootReq из бэкенда.

// Типы под ответ сервиса
type RootMethod = 'fixed' | 'newton'
type RootResp = {
	root: number
	converged: boolean
	iterations: number
	trace: number[]
	residualF: number
	delta: number
	message?: string
}

const methods: { value: RootMethod; label: string; desc: string }[] = [
	{
		value: 'newton',
		label: 'Метод Ньютона (Newton–Raphson)',
		desc: "xₖ₊₁ = xₖ − f(xₖ)/f'(xₖ)",
	},
	{
		value: 'fixed',
		label: 'Метод простой итерации (Fixed-Point)',
		desc: 'xₖ₊₁ = g(xₖ)',
	},
]

function pretty(num: number, digits = 8) {
	if (Number.isNaN(num) || !Number.isFinite(num)) return String(num)
	return Number(num).toExponential(digits)
}

export default function SolverNewtonFixed() {
	const [autoG, setAutoG] = useState<boolean>(true) // авто g(x)=x - α f(x)
	const [alpha, setAlpha] = useState<number>(1)
	// Метод и выражения
	const [method, setMethod] = useState<RootMethod>('newton')
	const [f, setF] = useState<string>('cos(x)-x')
	const [g, setG] = useState<string>('cos(x)') // для fixed-point

	// Параметры
	const [x0, setX0] = useState<number>(1)
	const [tol, setTol] = useState<number>(1e-8)
	const [maxIter, setMaxIter] = useState<number>(100)
	const [useNumDer, setUseNumDer] = useState<boolean>(true) // Ньютона
	const [relax, setRelax] = useState<number>(1) // Fixed-Point (0<α≤1)

	const [loading, setLoading] = useState(false)
	const [res, setRes] = useState<RootResp | null>(null)
	const [error, setError] = useState<string | null>(null)
	// helper: "A=B" -> "(A)- (B)"; иначе возвращаем как есть

	async function solve() {
		setLoading(true)
		setError(null)
		setRes(null)
		try {
			// строим g(x): вручную или автоматически
			const gExpr =
				method === 'fixed' ? (autoG ? `(x)-(${alpha})*(${f})` : g) : ''

			const body: any = {
				method,
				f: normalizeExpr(f),
				g: method === 'fixed' ? normalizeExpr(gExpr) : '',
				x0,
				x1: 0, // не нужен для этих методов
				tol,
				maxIter,
				useNumDer,
				relax,
			}
			const r = await fetch('/api/solve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			const data: RootResp = await r.json()
			if (!r.ok)
				throw new Error(
					(data as any)?.error || data?.message || 'Ошибка расчёта'
				)
			setRes(data)
		} catch (e: any) {
			setError(e.message || 'Ошибка сети')
		} finally {
			setLoading(false)
		}
	}

	const iterRows = useMemo(() => {
		if (!res?.trace) return [] as { k: number; x: number; dx: number }[]
		const arr: { k: number; x: number; dx: number }[] = []
		for (let i = 0; i < res.trace.length; i++) {
			const xk = res.trace[i]
			const prev = i > 0 ? res.trace[i - 1] : xk
			arr.push({ k: i, x: xk, dx: Math.abs(xk - prev) })
		}
		return arr
	}, [res])

	const xChartData = iterRows.map((d) => ({ k: d.k, x: d.x }))
	const dxChartData = iterRows.map((d) => ({
		k: d.k,
		dx: Math.max(d.dx, 1e-18),
	}))

	return (
		<>
			<header className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-bold">
						Корни уравнения: Ньютона и Простая итерация
					</h1>
				</div>
				<button
					onClick={solve}
					disabled={loading}
					className="rounded-2xl px-5 py-2 text-sm font-medium shadow-sm ring-1 ring-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
				>
					{loading ? 'Считаем…' : 'Запустить расчёт'}
				</button>
			</header>

			{/* Панель параметров */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200"
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">Метод</label>
						<select
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={method}
							onChange={(e) => setMethod(e.target.value as RootMethod)}
						>
							{methods.map((m) => (
								<option key={m.value} value={m.value}>
									{m.label}
								</option>
							))}
						</select>
						<div className="text-xs text-neutral-400 mt-1">
							{methods.find((m) => m.value === method)?.desc}
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
						<label className="text-xs text-neutral-500">
							Начальное приближение x₀
						</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={x0}
							onChange={(e) => setX0(Number(e.target.value))}
						/>
					</div>
				</div>

				{method === 'fixed' && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-1">
							<label className="text-xs text-neutral-500">
								g(x) для x=g(x)
							</label>
							<input
								className="w-full rounded-xl border border-neutral-300 p-2 text-sm font-mono"
								value={autoG ? `(x)-(${alpha})*(${f})` : g}
								onChange={(e) => {
									setG(e.target.value)
									setAutoG(false)
								}}
								placeholder="например: cos(x) или оставьте авто"
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
								Можно писать и как уравнение: A=B — мы преобразуем в (A)-(B).
							</div>
						</div>
						<div className="space-y-1">
							<label className="text-xs text-neutral-500">
								relax (0 &lt; α ≤ 1)
							</label>
							<input
								type="number"
								step="any"
								className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
								value={relax}
								onChange={(e) => setRelax(Number(e.target.value))}
							/>
						</div>
					</div>
				)}

				{method === 'newton' && (
					<div className="flex items-center gap-2">
						<input
							id="numder"
							type="checkbox"
							checked={useNumDer}
							onChange={(e) => setUseNumDer(e.target.checked)}
						/>
						<label htmlFor="numder" className="text-sm">
							Использовать численную производную
						</label>
					</div>
				)}

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<label className="text-xs text-neutral-500">maxIter</label>
						<input
							type="number"
							className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
							value={maxIter}
							onChange={(e) => setMaxIter(Number(e.target.value))}
						/>
					</div>
				</div>
			</motion.div>

			{/* Результаты */}
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

				{res && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
							<div className="text-xs text-neutral-500">Сходимость</div>
							<div className="mt-1 flex items-center gap-2">
								<span
									className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
										res.converged
											? 'bg-green-100 text-green-700'
											: 'bg-amber-100 text-amber-700'
									}`}
								>
									{res.converged ? 'Converged' : 'Not converged'}
								</span>
								{res.message && (
									<span className="text-xs text-neutral-400">
										{res.message}
									</span>
								)}
							</div>
							<div className="mt-3 text-sm">
								Итераций: <b>{res.iterations}</b>
							</div>
							<div className="mt-1 text-sm">
								Корень: <b className="font-mono">{pretty(res.root)}</b>
							</div>
							<div className="mt-1 text-sm">
								|f(x*)|: <b className="font-mono">{pretty(res.residualF)}</b>
							</div>
							<div className="mt-1 text-sm">
								|Δx| (послед.): <b className="font-mono">{pretty(res.delta)}</b>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:col-span-2">
							<div className="mb-2 text-sm font-medium">График xₖ</div>
							<div className="h-52 w-full">
								<ResponsiveContainer>
									<LineChart
										data={xChartData}
										margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="k" tick={{ fontSize: 12 }} />
										<YAxis tick={{ fontSize: 12 }} />
										<Tooltip />
										<Legend />
										<Line type="monotone" dataKey="x" dot={false} name="xₖ" />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:col-span-3">
							<div className="mb-2 text-sm font-medium">
								График |xₖ − xₖ₋₁| (лог шкала)
							</div>
							<div className="h-56 w-full">
								<ResponsiveContainer>
									<LineChart
										data={dxChartData}
										margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="k" tick={{ fontSize: 12 }} />
										<YAxis
											scale="log"
											domain={[1e-18, 'auto']}
											tick={{ fontSize: 12 }}
										/>
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="dx"
											dot={false}
											name="|Δx|"
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 md:col-span-3">
							<div className="mb-2 text-sm font-medium">Таблица итераций</div>
							<div className="overflow-auto">
								<table className="min-w-full text-left text-sm">
									<thead>
										<tr className="border-b bg-neutral-50 text-neutral-600">
											<th className="px-3 py-2">k</th>
											<th className="px-3 py-2">xₖ</th>
											<th className="px-3 py-2">|xₖ − xₖ₋₁|</th>
										</tr>
									</thead>
									<tbody>
										{iterRows.map((r) => (
											<tr key={r.k} className="border-b last:border-0">
												<td className="px-3 py-2 font-mono text-xs text-neutral-600">
													{r.k}
												</td>
												<td className="px-3 py-2 font-mono">{pretty(r.x)}</td>
												<td className="px-3 py-2 font-mono">{pretty(r.dx)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{!res && !error && (
					<div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
						Введите f(x) (и g(x) для фиксированной точки), задайте параметры и
						нажмите «Запустить расчёт».
					</div>
				)}
			</motion.div>
		</>
	)
}
