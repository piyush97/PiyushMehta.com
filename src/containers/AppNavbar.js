import styled, { css, up } from '@xstyled/styled-components';
import { motion } from 'framer-motion';
import { Link } from 'gatsby';
import React from 'react';
import resume from '../assets/_resume_.pdf';
import { Navbar, NavbarBrand, NavbarSecondary } from '../components/Navbar';

const links = {
  about: '$whoami',
  blog: 'Blog',
  uses: 'Uses',
  projects: 'Projects',
  videos: 'Videos',
  resume: 'Resume',
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
    'md',
    css`
      margin: 0 3;
      font-size: 18;
    `
  )}
`;

const list = {
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.3,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: 'afterChildren',
    },
  },
};

const item = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -460 },
};
export function AppNavbar() {
  return (
    <motion.div initial="hidden" animate="visible" variants={list}>
      <Navbar>
        {' '}
        <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/">
            <NavbarBrand>Piyush Mehta</NavbarBrand>
          </Link>
        </motion.span>
        <NavbarSecondary>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <Link to="/about">{links.about}</Link>
            </LinkStyle>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <Link to="/blog">{links.blog}</Link>
            </LinkStyle>{' '}
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <Link to="/uses">{links.uses}</Link>
            </LinkStyle>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <Link to="/projects">{links.projects}</Link>
            </LinkStyle>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <Link to="/videos">{links.videos}</Link>
            </LinkStyle>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <LinkStyle>
              <a href={resume} target="_blank" rel="noreferrer">
                {links.resume}
              </a>
            </LinkStyle>
          </motion.div>
        </NavbarSecondary>
      </Navbar>
    </motion.div>
  );
}
