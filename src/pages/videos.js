import { graphql } from 'gatsby';
import React from 'react';
import { PageContainer } from '../components/Container';
import { SectionDescription, SectionTitle } from '../components/Section';
import { LatestVideos } from '../containers/LatestVideos';
import { Seo } from '../containers/Seo';

export default function Videos({ data }) {
  return (
    <>
      <Seo title="Piyush Mehta - Videos" />
      <PageContainer>
        <SectionTitle>Videos</SectionTitle>
        <SectionDescription>
          I Teach React, JavaScript, UI/UX and how to solve problems. Enjoy!
        </SectionDescription>
        <LatestVideos edges={data.allYoutubeVideo.edges} />
      </PageContainer>
    </>
  );
}

export const pageQuery = graphql`
  query {
    allYoutubeVideo {
      edges {
        node {
          id
          title
          description
          videoId
          publishedAt
          privacyStatus
          channelTitle
          localThumbnail {
            childImageSharp {
              fluid(maxWidth: 400, quality: 50) {
                ...GatsbyImageSharpFluid
                ...GatsbyImageSharpFluidLimitPresentationSize
              }
            }
          }
        }
      }
    }
  }
`;
