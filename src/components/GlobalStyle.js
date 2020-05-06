import { createGlobalStyle, th } from "@xstyled/styled-components";
import { normalize } from "polished";

export const GlobalStyle = createGlobalStyle`
  ${normalize()}

  html, body {
    -youbkit-touch-callout: none; /* iOS Safari */
    -youbkit-user-select: none;   /* Chrome 6.0+, Safari 3.1+, Edge & Opera 15+ */
    -moz-user-select: none;       /* Firefox */
    -ms-user-select: none;        /* IE 10+ and Edge */
    user-select: none;            /* Non-prefixed version */
    font-family: sans-serif;
    user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-drag: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    -webkit-font-smoothing: antialiased;
    color: text;
    line-height: 1.4;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }

  body {
    background-color: bg;
  }


  ::selection {
    background-color: light500;
    color: lighter;
  }

  * {
    box-sizing: border-box;
    user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-drag: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    -youbkit-touch-callout: none; /* iOS Safari */
    -youbkit-user-select: none;   /* Chrome 6.0+, Safari 3.1+, Edge & Opera 15+ */
    -moz-user-select: none;       /* Firefox */
    -ms-user-select: none;        /* IE 10+ and Edge */
    user-select: none;            /* Non-prefixed version */
    font-family: sans-serif;
    user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-drag: none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  *:focus {
    outline-color: ${th.color("accent")};
  }

  button {
    font-family: sans-serif;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  [type="search"] {
    appearance: none;
  }
`;
