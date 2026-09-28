import { marked } from 'marked';
import DOMPurify from 'dompurify';

const renderer = new marked.Renderer();
const defaultLinkRenderer = renderer.link.bind(renderer);

renderer.link = function (tokens) {
  const html = defaultLinkRenderer(tokens);
  return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
};

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote',
        'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'title'],
    });
  } catch (e) {
    console.error('Failed to parse markdown:', e);
    return DOMPurify.sanitize(content.replace(/\n/g, '<br/>'));
  }
}
