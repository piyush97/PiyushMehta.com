import React, { useEffect } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { SectionTitle } from '../components/Section';
import { Container } from '../components/Container';
import { Hero, HeroIntro, HeroTitle, HeroTeaser } from '../containers/Hero';
import { LatestArticles } from '../containers/LatestArticles';
import { Seo } from '../containers/Seo';

export default function IndexPage({ data }) {
  useEffect(() => {
    document.oncontextmenu = function () {
      return false;
    };
  });
  return (
    <>
      <Hero>
        <Seo />
        <HeroIntro>Hi, my name is</HeroIntro>
        <HeroTitle>
          <strong>Piyush Mehta</strong>
          <br />I make the web great.
        </HeroTitle>
        <img src={data.photo.childImageSharp}></img>
        <HeroTeaser>
          I am a Full Stack Developer/Designer based in India. I create, Design
          tools for web and teach how to build high quality websites and
          applications using JavaScript, React
        </HeroTeaser>
      </Hero>
      <Container forwardedAs="section" pb={5}>
        <SectionTitle forwardedAs="h2">Blog</SectionTitle>
        <LatestArticles edges={data.allMdx.edges} />
      </Container>
    </>
  );
}

export const pageQuery = graphql`
  query {
    allMdx(
      limit: 5
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { published: { ne: false } } }
    ) {
      edges {
        node {
          excerpt(pruneLength: 190)
          id
          fields {
            link
          }
          frontmatter {
            title
            slug
            date(formatString: "MMMM DD, YYYY")
          }
        }
      }
    }
    photo: file(relativePath: { eq: "piyush-devfest.jpg" }) {
      childImageSharp {
        fluid(maxWidth: 1000) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`;
