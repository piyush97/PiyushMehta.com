import React, { useEffect } from 'react';
import styled from '@xstyled/styled-components';
import { PageContainer } from '../components/Container';
import { SectionDescription } from '../components/Section';

const Title = styled.h1`
  color: lighter;
  margin: 2 0;
`;

export default function NotFound() {
  useEffect(() => {
    document.oncontextmenu = function () {
      return false;
    };
  });
  return (
    <PageContainer style={{ textAlign: 'center' }}>
      <Title>
        Page not found{' '}
        <span role="img" aria-label="afraid emoji">
          😰
        </span>
      </Title>
      <SectionDescription>
        <a href="https://piyushmehta.com">
          <img
            alt="404 gif"
            src="https://assets.materialup.com/uploads/c13818e8-9e42-4f4d-b657-38743a81b270/preview.gif"
            style={{ width: '100%' }}
          />
        </a>
      </SectionDescription>
      <div></div>
    </PageContainer>
  );
}
