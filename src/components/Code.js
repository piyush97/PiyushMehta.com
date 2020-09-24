import React from 'react';
import styled, {
  css,
  ThemeContext,
  useColorMode,
  up,
} from '@xstyled/styled-components';
import Highlight, { defaultProps } from 'prism-react-renderer';
import getPrismTheme from './prismTheme';

const Editor = styled.div`
  background-color: light800;
  color: light100;
  padding: 3 4;
  margin: 5 -4;
  overflow: auto;
  font-size: 16;
  line-height: 1.4;
  overflow-y: auto;

  > textarea:focus {
    outline: none;
  }

  ${up(
    'sm',
    css`
      border-radius: 3;
    `
  )}
`;
const LangKey = styled.pre`
  margin-top: 0;
  border: 2px solid;
  padding: 0 1em 0.2em 1em;
  max-width: max-content;
`;

const Line = styled.div`
  display: table-row;
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.5;
`;

const LineContent = styled.span`
  display: table-cell;
`;
const globalModules = {
  react: 'React',
};

export function LiveConfig({ modules }) {
  Object.assign(globalModules, modules);
  return null;
}

export function usePrismTheme() {
  const theme = React.useContext(ThemeContext);
  const [mode] = useColorMode();
  return getPrismTheme({ theme, mode });
}

export function Code({ children, lang = 'markup' }) {
  const prismTheme = usePrismTheme();
  return (
    <>
      <Editor>
        <LangKey>{lang}</LangKey>
        <Highlight
          {...defaultProps}
          code={children.trim()}
          language={lang}
          theme={prismTheme}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => (
                <Line key={i} {...getLineProps({ line, key: i })}>
                  <LineNo>{i + 1}</LineNo>
                  <LineContent>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </LineContent>
                </Line>
              ))}
            </pre>
          )}
        </Highlight>
      </Editor>
    </>
  );
}
