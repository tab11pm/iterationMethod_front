// app/api/brackets/route.ts
import { normalizeExpr } from '@/utils/normalizeExpr'
import { NextRequest, NextResponse } from 'next/server'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
	try {
		const body: { f: string; xmin: number; xmax: number; steps: number } =
			await req.json()
		console.log(body)
		const { f, xmin, xmax, steps } = body

		const r = await fetch(`${BACKEND_URL}/api/v1/root/bracket`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			// body: JSON.stringify(body),
			body: JSON.stringify({ f: normalizeExpr(f), a: xmin, b: xmax, steps }),
		})
		const data = await r.text()
		const ct = r.headers.get('content-type') || ''
		if (!r.ok) return NextResponse.json({ error: data }, { status: r.status })
		if (ct.includes('application/json'))
			return NextResponse.json(JSON.parse(data))
		return new NextResponse(data, { status: 200 })
	} catch (e: any) {
		return NextResponse.json(
			{ error: e.message || 'Server error' },
			{ status: 500 }
		)
	}
}
