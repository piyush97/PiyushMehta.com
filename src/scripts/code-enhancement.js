/**
 * Code Block Enhancement Script
 * Automatically enhances existing code blocks with copy buttons and improved styling
 */

class CodeEnhancer {
  constructor() {
    this.enhanceAllCodeBlocks();
    this.setupObserver();
  }

  enhanceAllCodeBlocks() {
    // Find all pre > code elements that aren't already enhanced
    const codeBlocks = document.querySelectorAll('pre:not(.enhanced) > code');

    codeBlocks.forEach((code) => {
      this.enhanceCodeBlock(code);
    });
  }

  enhanceCodeBlock(codeElement) {
    const pre = codeElement.parentElement;
    if (!pre || pre.tagName !== 'PRE') return;

    // Mark as enhanced to avoid double processing
    pre.classList.add('enhanced');

    // Get code content and language
    const codeContent = codeElement.textContent || '';
    const language = this.detectLanguage(codeElement);

    // Create enhanced wrapper
    const wrapper = document.createElement('div');
    wrapper.className =
      'code-block-container group relative my-6 overflow-hidden rounded-lg border border-card-border bg-code-bg';

    // Create header if we have language info
    let header = null;
    if (language) {
      header = this.createHeader(language, codeContent);
      wrapper.appendChild(header);
    }

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'relative';

    // Style the existing pre element
    pre.className = 'code-content overflow-x-auto p-4 text-sm leading-relaxed m-0';
    pre.setAttribute('data-language', language);

    // Style the code element
    codeElement.className = `language-${language}`;
    codeElement.setAttribute('tabindex', '0');
    codeElement.setAttribute('role', 'textbox');
    codeElement.setAttribute('aria-label', `Code snippet${language ? ` in ${language}` : ''}`);
    codeElement.setAttribute('aria-readonly', 'true');

    // Add copy button for headerless blocks
    if (!header) {
      const copyButton = this.createFloatingCopyButton(codeContent);
      contentWrapper.appendChild(copyButton);
    }

    // Assemble the enhanced structure
    contentWrapper.appendChild(pre);
    wrapper.appendChild(contentWrapper);

    // Replace the original pre with the enhanced version
    pre.parentElement.replaceChild(wrapper, pre);

    // Apply syntax highlighting
    this.applySyntaxHighlighting(codeElement, language);
  }

  detectLanguage(codeElement) {
    // Check for existing language class
    const classMatch = codeElement.className.match(/language-(\w+)/);
    if (classMatch) return classMatch[1];

    // Check pre element for language class
    const preClassMatch = codeElement.parentElement?.className.match(/language-(\w+)/);
    if (preClassMatch) return preClassMatch[1];

    // Check for data-language attribute
    const dataLang =
      codeElement.getAttribute('data-language') ||
      codeElement.parentElement?.getAttribute('data-language');
    if (dataLang) return dataLang;

    // Try to detect language from content patterns
    const content = codeElement.textContent || '';
    return this.guessLanguageFromContent(content);
  }

  guessLanguageFromContent(content) {
    const patterns = {
      javascript:
        /(?:function\s+\w+|const\s+\w+\s*=|let\s+\w+|var\s+\w+|=>|console\.log|require\(|import\s+.*from)/,
      typescript:
        /(?:interface\s+\w+|type\s+\w+\s*=|<.*>|as\s+\w+|public\s+|private\s+|readonly\s+)/,
      python:
        /(?:def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\(|if\s+__name__\s*==|class\s+\w+.*:)/,
      css: /(?:\{[^{}]*\}|@media|@import|#\w+|\.[\w-]+|:[\w-]+)/,
      html: /(?:<\/?[a-z][\s\S]*>|<!DOCTYPE|&\w+;)/i,
      json: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
      bash: /(?:#!\/bin\/bash|#!\/bin\/sh|\$\s+|sudo\s+|apt\s+|npm\s+|git\s+|curl\s+|wget\s+)/,
      sql: /(?:SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|CREATE\s+|ALTER\s+|DROP\s+)/i,
      yaml: /(?:^\s*-\s+|\w+:\s*$|\w+:\s+[^{[])/m,
      xml: /(?:<\?xml|<\/?[a-z][\s\S]*>)/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        return lang;
      }
    }

    return 'text';
  }

  createHeader(language, codeContent) {
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between px-4 py-3 bg-code-header border-b border-card-border';

    // Language indicator
    const languageDiv = document.createElement('div');
    languageDiv.className = 'flex items-center space-x-3';
    languageDiv.innerHTML = `
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full bg-green-400"></div>
        <span class="text-xs text-light-400 uppercase font-mono">${language}</span>
      </div>
    `;

    // Copy button
    const copyButton = this.createCopyButton(codeContent);

    header.appendChild(languageDiv);
    header.appendChild(copyButton);

    return header;
  }

  createCopyButton(codeContent) {
    const button = document.createElement('button');
    button.className =
      'copy-code-btn flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-light-300 bg-light-800 hover:bg-light-700 hover:text-light-100 transition-all duration-200 rounded-md border border-light-600 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30';
    button.setAttribute('data-code', codeContent);
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('title', 'Copy to clipboard');

    button.innerHTML = `
      <svg class="copy-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <svg class="check-icon w-4 h-4 hidden text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span class="copy-text">Copy</span>
    `;

    return button;
  }

  createFloatingCopyButton(codeContent) {
    const button = document.createElement('button');
    button.className =
      'copy-code-btn absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 text-xs font-medium text-light-400 bg-light-800/80 hover:bg-light-700 hover:text-light-100 transition-all duration-200 rounded border border-light-600 hover:border-accent/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent/30';
    button.setAttribute('data-code', codeContent);
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('title', 'Copy to clipboard');

    button.innerHTML = `
      <svg class="copy-icon w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <svg class="check-icon w-3 h-3 hidden text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;

    return button;
  }

  applySyntaxHighlighting(codeElement, language) {
    if (codeElement.querySelector('.token')) return; // Already highlighted

    let content = codeElement.innerHTML;
    const patterns = this.getSyntaxPatterns(language);

    // Apply patterns in order of precedence
    const patternOrder = [
      'comment',
      'string',
      'regex',
      'number',
      'keyword',
      'operator',
      'punctuation',
    ];

    patternOrder.forEach((type) => {
      if (patterns[type]) {
        content = content.replace(patterns[type].regex, patterns[type].replacement);
      }
    });

    codeElement.innerHTML = content;
  }

  getSyntaxPatterns(language) {
    const commonPatterns = {
      comment: {
        regex: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|<!--[\s\S]*?-->)/gm,
        replacement: '<span class="token comment">$1</span>',
      },
      string: {
        regex: /(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g,
        replacement: '<span class="token string">$1$2$3</span>',
      },
      number: {
        regex: /\b\d+(\.\d+)?\b/g,
        replacement: '<span class="token number">$&</span>',
      },
    };

    const languageSpecific = {
      javascript: {
        ...commonPatterns,
        keyword: {
          regex:
            /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield)\b/g,
          replacement: '<span class="token keyword">$&</span>',
        },
        operator: {
          regex: /[+\-*/%=!<>&|?:]/g,
          replacement: '<span class="token operator">$&</span>',
        },
      },
      typescript: {
        ...commonPatterns,
        keyword: {
          regex:
            /\b(abstract|any|as|async|await|boolean|break|case|catch|class|const|constructor|continue|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|never|new|null|number|object|package|private|protected|public|readonly|require|return|set|static|string|super|switch|symbol|this|throw|true|try|type|typeof|undefined|unique|unknown|var|void|while|with|yield)\b/g,
          replacement: '<span class="token keyword">$&</span>',
        },
      },
      python: {
        ...commonPatterns,
        keyword: {
          regex:
            /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield|True|False|None)\b/g,
          replacement: '<span class="token keyword">$&</span>',
        },
      },
      css: {
        ...commonPatterns,
        selector: {
          regex: /([.#]?[\w-]+)(\s*{)/g,
          replacement: '<span class="token selector">$1</span>$2',
        },
        property: {
          regex: /([\w-]+)(\s*:)/g,
          replacement: '<span class="token property">$1</span>$2',
        },
      },
    };

    return languageSpecific[language] || commonPatterns;
  }

  setupCopyFunctionality() {
    document.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.copy-code-btn');
      if (!copyBtn) return;

      const code =
        copyBtn.dataset.code ||
        copyBtn.closest('.code-block-container')?.querySelector('code')?.textContent ||
        '';

      if (!code.trim()) {
        this.showFeedback(copyBtn, 'No code to copy', 'error');
        return;
      }

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(code);
        } else {
          this.fallbackCopy(code);
        }
        this.showFeedback(copyBtn, 'Copied!', 'success');
      } catch (err) {
        console.error('Failed to copy code:', err);
        this.showFeedback(copyBtn, 'Copy failed', 'error');
      }
    });
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy'); // Note: deprecated but kept for compatibility
    } finally {
      document.body.removeChild(textArea);
    }
  }

  showFeedback(button, message, type) {
    const copyIcon = button.querySelector('.copy-icon');
    const checkIcon = button.querySelector('.check-icon');
    const copyText = button.querySelector('.copy-text');

    if (type === 'success') {
      copyIcon?.classList.add('hidden');
      checkIcon?.classList.remove('hidden');
      if (copyText) copyText.textContent = message;

      setTimeout(() => {
        copyIcon?.classList.remove('hidden');
        checkIcon?.classList.add('hidden');
        if (copyText) copyText.textContent = 'Copy';
      }, 2000);
    } else {
      button.classList.add('shake');
      if (copyText) {
        const originalText = copyText.textContent;
        copyText.textContent = message;
        setTimeout(() => {
          copyText.textContent = originalText;
          button.classList.remove('shake');
        }, 2000);
      }
    }
  }

  setupObserver() {
    // Watch for dynamically added code blocks
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element node
              // Check if the node itself is a pre > code
              if (node.tagName === 'PRE' && !node.classList.contains('enhanced')) {
                const code = node.querySelector('code');
                if (code) this.enhanceCodeBlock(code);
              }

              // Check for pre > code within the node
              const codeBlocks = node.querySelectorAll?.('pre:not(.enhanced) > code');
              codeBlocks?.forEach((code) => this.enhanceCodeBlock(code));
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Initialize when DOM is ready
function initCodeEnhancer() {
  const enhancer = new CodeEnhancer();
  enhancer.setupCopyFunctionality();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeEnhancer);
} else {
  initCodeEnhancer();
}

// Export for external use
if (typeof window !== 'undefined') {
  window.CodeEnhancer = CodeEnhancer; // Global assignment for compatibility
}
