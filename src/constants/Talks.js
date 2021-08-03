import { Box } from '@xstyled/styled-components';
import { graphql, useStaticQuery } from 'gatsby';
import Img from 'gatsby-image';
import React from 'react';
import { Card, CardBody, CardTitle } from '../components/Card';

export const TalksData = () => {
  const { talk1Image, talk2Image, talk3Image } = useStaticQuery(graphql`
    query {
      talk1Image: file(relativePath: { eq: "talk1.png" }) {
        childImageSharp {
          fluid(maxWidth: 400, quality: 100) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
      talk2Image: file(relativePath: { eq: "talk2.jpeg" }) {
        childImageSharp {
          fluid(maxWidth: 400, quality: 100) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
      talk3Image: file(relativePath: { eq: "talk3.jpeg" }) {
        childImageSharp {
          fluid(maxWidth: 400, quality: 100) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
    }
  `);
  return (
    <Box>
      <Card my="2">
        <CardBody>
          <CardTitle>Introduction to Containers & Kuberenetes</CardTitle>
          <Img fluid={talk1Image.childImageSharp.fluid} alt="test" />
        </CardBody>
      </Card>
      <Card my="2">
        <CardBody>
          <CardTitle>Career Opportunities in Tech</CardTitle>
          <Img fluid={talk2Image.childImageSharp.fluid} alt="test" />
        </CardBody>
      </Card>
      <Card my="2">
        <CardBody>
          <CardTitle>Introduction To Programming</CardTitle>
          <Img fluid={talk3Image.childImageSharp.fluid} alt="test" />
        </CardBody>
      </Card>
    </Box>
  );
};
