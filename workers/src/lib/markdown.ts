// Minimal Markdown → HTML (no dependencies, Workers-compatible)
export function md(text: string): string {
  return text
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // table (simple)
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split('|').map((c: string) => c.trim())
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => `<table class="md-table">${m}</table>`)
    // horizontal rule
    .replace(/^---$/gm, '<hr>')
    // paragraphs (double newline)
    .replace(/\n\n(?!<[hut])/g, '</p><p>')
    .replace(/^(?!<[hut1-6]|<li|<block|<hr|<img|<a)(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
    // cleanup empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
}
