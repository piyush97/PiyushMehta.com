import React from 'react';
import styled from '@xstyled/styled-components';

const InlineH3 = styled.span`
  font-size: 1.17em;
`;

const Tags = ({ categories }) => {
  return (
    <div>
      <InlineH3>Tags: </InlineH3>
      <span>{categories[0]}</span>
      {categories.map((cate, i) => {
        if (i === 0) {
          return null;
        }
        return <span>, {cate}</span>;
      })}
    </div>
  );
};

export default Tags;
