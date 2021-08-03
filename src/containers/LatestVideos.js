import { Box } from '@xstyled/styled-components';
import { Link } from 'gatsby';
import Img from 'gatsby-image';
import React from 'react';
import { Card, CardBody, CardLink, CardTitle } from '../components/Card';
import { Grid } from '../components/GridSystem';
import getVideoLink from '../utils/video';

export function LatestVideos({ edges }) {
  return (
    <>
      <Box row my={5}>
        Total Videos till Date: {edges.length}
      </Box>
      <Grid>
        {edges.map((edge) => (
          <Box key={edge.node.id}>
            <CardLink as={Link} to={getVideoLink(edge.node.videoId)}>
              <Card>
                <CardBody>
                  <CardTitle>{edge.node.title}</CardTitle>
                  <Img
                    fluid={edge.node.localThumbnail.childImageSharp.fluid}
                    draggable={false}
                  />
                </CardBody>
              </Card>
            </CardLink>
          </Box>
        ))}
      </Grid>
    </>
  );
}
