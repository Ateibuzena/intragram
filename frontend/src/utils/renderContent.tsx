/**
 * Renders plain text with Markdown code blocks (```lang\ncode```) as
 * styled <pre><code> elements. The rest of the text is displayed as-is.
 */

export function renderContent(content: string): JSX.Element {
	const CODE_BLOCK_RE = /```(\w*)\n?([\s\S]*?)```/g;
	const parts: (string | JSX.Element)[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = CODE_BLOCK_RE.exec(content)) !== null) {
		if (match.index > lastIndex) {
			parts.push(content.slice(lastIndex, match.index));
		}
		const lang = match[1] ?? '';
		const code = match[2] ?? '';
		parts.push(
			<pre key={match.index} className="bg-black/50 border border-ft-border rounded-lg p-3 mt-2 mb-1 overflow-x-auto text-left">
				{lang && (
					<span className="block text-[10px] text-ft-muted mb-1.5 font-mono uppercase tracking-wider select-none">
						{lang}
					</span>
				)}
				<code className="text-xs text-ft-cyan font-mono whitespace-pre">{code}</code>
			</pre>,
		);
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		parts.push(content.slice(lastIndex));
	}

	return <>{parts.length > 0 ? parts : content}</>;
}
