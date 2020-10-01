import React from 'react';
import styled from '@xstyled/styled-components';

const TagP = styled.p`
  background-color: light500;
  border-radius: 5px;
  padding: 0.2em 0.4em 0.2em 0.4em;
  font-size: 0.9em;
  margin: 0.4em;
`;

const TagDiv = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Tags = ({ categories }) => {
  return (
    <div>
      <h3>Tags: </h3>
      <TagDiv>
        {categories.map((cate) => {
          return <TagP>{cate}</TagP>;
        })}
      </TagDiv>
    </div>
  );
};

export default Tags;
