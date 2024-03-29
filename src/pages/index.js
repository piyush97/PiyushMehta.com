/* eslint-disable no-console */
import { graphql } from 'gatsby';
import React from 'react';
import GitHubButton from 'react-github-btn';
import { Container } from '../components/Container';
import { SectionTitle } from '../components/Section';
import { Hero, HeroIntro, HeroTeaser, HeroTitle } from '../containers/Hero';
import { LatestArticles } from '../containers/LatestArticles';
import { Seo } from '../containers/Seo';

export default class IndexPage extends React.Component {
  componentDidMount() {
    console.log(
      '%c Made By Piyush Mehta',
      'font-family:Comic Sans MS; font-size:50px; font-weight:bold; background: linear-gradient(#f00, yellow); border-radius: 5px; padding: 20px'
    );
  }

  render() {
    return (
      <>
        <Hero>
          <Seo />
          <HeroIntro>Hi, my name is</HeroIntro>
          <HeroTitle>
            <strong>Piyush Mehta</strong>
            <br />
          </HeroTitle>

          <HeroTeaser>
            I am a full-time Full Stack Developer/Designer, an educator on
            youtube also known as CoderWhoKnows, a hobbyist Virtual Aviation
            Simmer with an experience of (180+ hours) and a trumpet player based
            in Canada{' '}
            <span role="img" aria-label="Canada Flag">
              🇨🇦
            </span>
            <br />
            <br />
            I create, design tools and Apps for companies and individuals.
            <br />
          </HeroTeaser>
          <GitHubButton
            href="https://github.com/piyush97"
            data-color-scheme="no-preference: dark; light: light; dark: light;"
            data-size="large"
            data-show-count="true"
            aria-label="Follow @piyush97 on GitHub"
          >
            Follow @piyush97
          </GitHubButton>
        </Hero>

        <Container forwardedAs="section" pb={5}>
          <SectionTitle forwardedAs="h2">Blog</SectionTitle>
          <LatestArticles edges={this.props.data.allMdx.edges} />
        </Container>
      </>
    );
  }
}

export const pageQuery = graphql`
  query {
    allMdx(
      limit: 7
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
