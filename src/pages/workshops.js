import { Box } from '@xstyled/styled-components';
import { React } from 'react';
import { Card, CardBody, CardLink, CardTitle } from '../components/Card';
import { PageContainer } from '../components/Container';
import { SectionDescription, SectionTitle } from '../components/Section';
import { Seo } from '../containers/Seo';

export default function Workshops() {
  return (
    <>
      <Seo title="Piyush Mehta - Workshops" />
      <PageContainer>
        <SectionTitle>Workshops</SectionTitle>
        <SectionDescription>
          I train student and Developers in Computer Science, Programming,
          Javascript, Web Development and some soft skills too
        </SectionDescription>
        <Box>
          <CardLink>
            <Card>
              <CardBody>
                <CardTitle>Test</CardTitle>
                {/* <Img
                    fluid={edge.node.localThumbnail.childImageSharp.fluid}
                    draggable={false}
                  /> */}
              </CardBody>
            </Card>
          </CardLink>
        </Box>
      </PageContainer>
    </>
  );
}
