import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	value: string | number
	label: string
}
export default function Input({ value, label, ...props }: InputProps) {
	return (
		<>
			<div className="space-y-1">
				<label className="text-xs text-neutral-500">{label}</label>
				<input
					type="number"
					className="w-full rounded-xl border border-neutral-300 p-2 text-sm"
					value={value}
					{...props}
				/>
			</div>
		</>
	)
}
