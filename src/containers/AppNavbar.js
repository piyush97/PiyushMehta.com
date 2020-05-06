import React from "react";
import styled, { css, up } from "@xstyled/styled-components";
import { Navbar, NavbarBrand, NavbarSecondary } from "../components/Navbar";
import { Link } from "gatsby";

const links = {
  about: "$whoami",
  blog: "Blog",
  uses: "Uses",
  // skills: "Skills",
};
const LinkStyle = styled.p`
  display: block;
  margin: 3 3;
  font-size: 20;
  font-weight: 500;
  color: lighter;
  transition: base;

  &:focus,
  &:hover {
    color: accent;
    outline: none;
  }

  ${up(
    "md",
    css`
      margin: 0 3;
      font-size: 18;
    `
  )}
`;
const A = styled.p`
  display: block;
  margin: 3 3;
  font-size: 20;
  font-weight: 500;
  color: lighter;
  transition: base;

  &:focus,
  &:hover {
    color: accent;
    outline: none;
  }

  ${up(
    "md",
    css`
      margin: 0 3;
      font-size: 18;
    `
  )}
`;
export function AppNavbar() {
  return (
    <Navbar>
      <Link to="/">
        <NavbarBrand>Piyush Mehta</NavbarBrand>
      </Link>
      <NavbarSecondary>
        <LinkStyle>
          <Link to="/about">{links.about}</Link>
        </LinkStyle>
        <LinkStyle>
          <Link to="/blog">{links.blog}</Link>
        </LinkStyle>
        <LinkStyle>
          <Link to="/uses">{links.uses}</Link>
        </LinkStyle>
        <LinkStyle>
          <Link to="/skills">{links.skills}</Link>
        </LinkStyle>
        <A>
          <a
            href="https://sourcerer.io/piyush97"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfolio
          </a>
        </A>
      </NavbarSecondary>
    </Navbar>
  );
}
