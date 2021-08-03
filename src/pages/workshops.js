import React from 'react';
import { PageContainer } from '../components/Container';
import { SectionDescription, SectionTitle } from '../components/Section';
import { Seo } from '../containers/Seo';
import WorkshopsContainer from '../containers/WorkshopsContainer';

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
        <WorkshopsContainer />
      </PageContainer>
    </>
  );
}
