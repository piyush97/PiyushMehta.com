/* eslint-disable react/button-has-type */
import styled, {
  css,
  ThemeContext,
  up,
  useColorMode,
} from '@xstyled/styled-components';
import Highlight, { defaultProps } from 'prism-react-renderer';
import React from 'react';
import Confetti from 'react-dom-confetti';
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
const config = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: '10px',
  height: '10px',
  perspective: '500px',
  colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
};

export const Button = (props) => (
  <button
    style={{
      position: 'absolute',
      top: 0,
      right: 0,
      border: 'none',
      boxShadow: 'none',
      textDecoration: 'none',
      margin: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      lineHeight: '1',
    }}
    {...props}
  />
);

const Wrapper = (props) => <div style={{ position: 'relative' }} {...props} />;

const ConfettiWrapper = (props) => (
  <div style={{ position: 'absolute', top: 0, right: 0 }} {...props} />
);

export function Code({ children, lang = 'markup' }) {
  const prismTheme = usePrismTheme();
  const [isCopied, setIsCopied] = React.useState(false);
  const copyToClipboard = (str) => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };
  return (
    <>
      <Wrapper>
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
                <Button
                  onClick={() => {
                    copyToClipboard(children.trim());
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 3000);
                  }}
                >
                  {isCopied ? '🎉 Copied!' : 'Copy'}
                </Button>
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
        <ConfettiWrapper>
          <Confetti active={isCopied} config={config} />
        </ConfettiWrapper>
      </Wrapper>
    </>
  );
}
