import { ReactNode } from 'react'
import cn from 'clsx'

export default function Container({
	children,
	className,
}: {
	children: ReactNode | string
	className?: string
}) {
	return (
		<>
			<div
				className={cn(
					'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200',
					className
				)}
			>
				{children}
			</div>
		</>
	)
}
