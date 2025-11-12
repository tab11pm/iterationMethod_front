type HeaderProps = {
	onClick: () => void
	loading: boolean
	title: string
}

export default function Header({ onClick, loading, title }: HeaderProps) {
	return (
		<>
			<header className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-2xl font-bold">{title}</h1>
				</div>
				<button
					onClick={onClick}
					disabled={loading}
					className="rounded-2xl px-5 py-2 text-sm font-medium shadow-sm ring-1 ring-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
				>
					{loading ? 'Считаем…' : 'Запустит'}
				</button>
			</header>
		</>
	)
}
