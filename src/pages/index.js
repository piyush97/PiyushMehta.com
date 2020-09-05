import React, { useEffect } from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { SectionTitle } from '../components/Section';
import { Container } from '../components/Container';
import { Hero, HeroIntro, HeroTitle, HeroTeaser } from '../containers/Hero';
import { LatestArticles } from '../containers/LatestArticles';
import { Seo } from '../containers/Seo';

export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    Sentry.configureScope((scope) => {
      Object.keys(errorInfo).forEach((key) => {
        scope.setExtra(key, errorInfo[key]);
      });
    });
    Sentry.captureException(error);

    console.log(
      '%c' + 'Made By Piyush Mehta',
      'font-family:Comic Sans MS; font-size:50px; font-weight:bold; background: linear-gradient(#f00, yellow); border-radius: 5px; padding: 20px'
    );
  }
  componentDidMount() {
    document.oncontextmenu = function () {
      return false;
    };
  }
  render() {
    if (this.state.error) {
      return <h1>Something went wrong!</h1>;
    } else {
      return (
        <>
          <Hero>
            <Seo />
            <HeroIntro>Hi, my name is</HeroIntro>
            <HeroTitle>
              <strong>Piyush Mehta</strong>
              <br />I make the web great.
            </HeroTitle>
            <HeroTeaser>
              I am a full-time Full Stack Developer/Designer, a hobbyist Virtual
              Aviation Simmer with an experience of (180+ hours) and a trumpet
              player based in India.
              <br />
              <br />
              I create, design tools and Apps for companies and individuals.
              <br />I write down my learnings in my blog sections so that people
              can learn from my mistakes.
            </HeroTeaser>
          </Hero>
          <Container forwardedAs="section" pb={5}>
            <SectionTitle forwardedAs="h2">Blog</SectionTitle>
            <LatestArticles edges={this.props.data.allMdx.edges} />
          </Container>
        </>
      );
    }
  }
}

export const pageQuery = graphql`
  query {
    allMdx(
      limit: 6
      sort: { fields: [frontmatter___date], order: ASC }
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
