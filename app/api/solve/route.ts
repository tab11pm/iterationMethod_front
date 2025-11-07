// app/api/solve/route.ts
// Этот route-прокси принимает запросы с фронта и пересылает их к бэкенду Gin.

import { NextRequest, NextResponse } from 'next/server'

// Настрой URL бэкенда: в dev можно localhost, в проде — env переменная
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const r = await fetch(`${BACKEND_URL}/api/v1/root/solve`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})

		const data = await r.text() // ответ может быть JSON или ошибка
		const contentType = r.headers.get('content-type') || ''

		if (!r.ok) {
			return NextResponse.json({ error: data }, { status: r.status })
		}

		// если backend вернул JSON, отдадим как есть
		if (contentType.includes('application/json')) {
			return NextResponse.json(JSON.parse(data))
		}

		// fallback для текста
		return new NextResponse(data, { status: 200 })
	} catch (err: any) {
		return NextResponse.json(
			{ error: err.message || 'Server error' },
			{ status: 500 }
		)
	}
}
