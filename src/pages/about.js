import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import { SectionTitle, SectionDescription } from '../components/Section';
import { Container } from '../components/Container';
import { Seo } from '../containers/Seo';
import { AboutContainer, AboutText, AboutImage } from '../containers/About';

export default function AboutPage() {
  const data = useStaticQuery(graphql`
    query {
      photo: file(relativePath: { eq: "piyush-devfest.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 1000) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
    }
  `);

  return (
    <>
      <Seo title="About - Piyush Mehta" />
      <AboutContainer>
        <Container>
          <SectionTitle>Hi I&#39;m Piyush!</SectionTitle>
          <SectionDescription>
            I&#39;m a software engineer based in India, who enjoys building
            things. I&#39;m a cross trainer, brass instrument player and a
            fitness enthusiast.
          </SectionDescription>
        </Container>
        <AboutImage img={data.photo.childImageSharp} />
        <AboutText>
          <p>
            I`&apos;`ve trained <strong>500+</strong> students for HTML, CSS,
            JS, React , Git and Data Structures with Placement Training while I
            was{' '}
            <a
              href="https://developers.google.com/community/dsc"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google DSC Lead
            </a>
            .{' '}
            <a
              href="https://photos.app.goo.gl/oLHmwLPseAtDFTk98"
              rel="noopener noreferrer"
              target="_blank"
            >
              <br />
              Here
            </a>{' '}
            and
            <a
              href="https://photos.app.goo.gl/7J7EgU2gmzoUWUoa8"
              rel="noopener noreferrer"
              target="_blank"
            >
              {' '}
              Here
            </a>{' '}
            are some of the photos and videos of my <strong>
              workshops
            </strong>{' '}
          </p>

          <p>
            I joined the founding team of{' '}
            <a
              href="https://www.gonuclei.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Nuclei
            </a>{' '}
            to build the{' '}
            <strong>
              First banking SDKs which enable better services to customers and
              banks in India
            </strong>
            .
          </p>

          <p>
            In 2017, I worked with{' '}
            <strong>
              {' '}
              <a
                href="http://www.meawwworld.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                MEAWW
              </a>
            </strong>
            , a single place for media and arts news and here I made Dashboard
            using React, Redux, Node to help Influencers reach the audience!
            Which is currently being used by influencers on{' '}
            <strong>Facebook, FlipBoard & Instagram</strong>.
          </p>

          <p>
            Over the years, I’ve become passionate about open source software
            and sharing with others behind my computer or as a speaker at
            conferences.
          </p>

          <p>
            Don&apos;t hesitate to reach out by{' '}
            <a href="mailto:me@piyushmehta.com">email</a> or on{' '}
            <a href="https://twitter.com/PiyushMehtas">Twitter</a>. I&apos;ll be
            happy to talk!
          </p>
        </AboutText>
      </AboutContainer>
    </>
  );
}
