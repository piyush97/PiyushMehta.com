import Markdown from 'react-markdown';
import { isAllowedUrl } from '../../utils/chat/guard';

/** Markdown with no raw HTML, no images, and links restricted to the same allowlist the server enforces. */
export default function Answer({ text }: { text: string }) {
  return (
    <Markdown
      skipHtml
      disallowedElements={['img', 'iframe', 'script']}
      unwrapDisallowed
      components={{
        a({ href, children }) {
          if (!href || !isAllowedUrl(href)) return <span>{children}</span>;
          return (
            <a
              href={href}
              rel="noopener noreferrer"
              target={href.includes('piyushmehta.com') ? undefined : '_blank'}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {text}
    </Markdown>
  );
}
