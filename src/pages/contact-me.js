import React from 'react';
import { PageContainer } from '../components/Container';
import { SectionDescription, SectionTitle } from '../components/Section';
import ContactContainer from '../containers/ContactContainer';
import { Seo } from '../containers/Seo';

const ContactMe = () => {
  return (
    <>
      <Seo title="Piyush Mehta - Book a session or contact" />
      <PageContainer>
        <SectionTitle>Book a Session or Contact Me</SectionTitle>
        <SectionDescription>
          I train student and Developers in Computer Science, Programming,
          Javascript, Web Development and some soft skills too
        </SectionDescription>
        <ContactContainer />
      </PageContainer>
    </>
  );
};

export default ContactMe;
