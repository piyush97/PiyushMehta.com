import { Box } from '@xstyled/styled-components';
import React from 'react';
import { Card, CardBody, CardTitle } from '../components/Card';

const ContactContainer = () => {
  return (
    <Box>
      <Card my="2">
        <CardTitle>Book a Session with me</CardTitle>
        <CardBody>
          {/* Temp Bad Code :P */}
          <a href="http://calendly.com/piyushmehta">
            <button type="button" style={{ padding: '10px', borderRadius: 10 }}>
              Book
            </button>
          </a>
        </CardBody>
      </Card>{' '}
    </Box>
  );
};

export default ContactContainer;
