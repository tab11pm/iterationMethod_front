// app/api/compare/route.ts
// Прокси для сравнения методов (Gin: POST /api/v1/root/compare)
import { NextRequest, NextResponse } from 'next/server'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const r = await fetch(`${BACKEND_URL}/api/v1/root/compare`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
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
