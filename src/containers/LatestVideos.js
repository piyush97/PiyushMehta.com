import { Box } from '@xstyled/styled-components';
import { Link } from 'gatsby';
import Img from 'gatsby-image';
import React from 'react';
import {
  Card,
  CardBody,
  CardLink,
  CardText,
  CardTitle,
} from '../components/Card';
import getVideoLink from '../utils/video';

export function LatestVideos({ edges }) {
  return (
    <>
      <Box row my={5}>
        Total Videos till Date: {edges.length}
      </Box>
      <Box row my={-2}>
        {edges.map((edge) => (
          <Box key={edge.node.id} col={1} py={2}>
            <CardLink as={Link} to={getVideoLink(edge.node.videoId)}>
              <Card>
                <CardBody>
                  <CardTitle>{edge.node.title}</CardTitle>
                  <Img fluid={edge.node.localThumbnail.childImageSharp.fluid} />
                  <Box py={4}>
                    <CardText>{Date(edge.node.publishedAt)}</CardText>
                  </Box>
                </CardBody>
              </Card>
            </CardLink>
          </Box>
        ))}
      </Box>
    </>
  );
}
