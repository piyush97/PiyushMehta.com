import { motion } from 'framer-motion';
import { graphql, Link, useStaticQuery } from 'gatsby';
import React from 'react';

import {
  Navbar,
  NavbarBrand,
  NavbarLink,
  NavbarSecondary,
} from '../components/Navbar';

const links = {
  about: '$whoami',
  blog: 'Blog',
  uses: 'Uses',
  // skills: "Skills",
};

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
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);
  return (
    <motion.div initial="hidden" animate="visible" variants={list}>
      <Navbar>
        <motion.span whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/">
            <NavbarBrand>{data.site.siteMetadata.title}</NavbarBrand>
          </Link>
        </motion.span>
        <NavbarSecondary>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            <NavbarLink>
              <Link
                to="/about
  "
              >
                {' '}
                {links.about}
              </Link>
            </NavbarLink>
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            {' '}
            <NavbarLink>
              <Link
                to="/blog
  "
              >
                {' '}
                {links.blog}
              </Link>
            </NavbarLink>{' '}
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            {' '}
            <NavbarLink>
              <Link
                to="/uses
  "
              >
                {' '}
                {links.uses}
              </Link>
            </NavbarLink>
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={item}
          >
            {' '}
            <NavbarLink>
              <a
                href="https:/ /
          sourcerer.io / piyush97 "
                target="_blank"
                rel="noopener noreferrer"
              >
                Portfolio
              </a>
            </NavbarLink>
          </motion.span>
        </NavbarSecondary>
      </Navbar>
    </motion.div>
  );
}
