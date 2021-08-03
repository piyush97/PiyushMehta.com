import styled from 'styled-components';

export const Grid = styled.div`
  /* display: 'block';

  @media screen and (min-width: 576px) {
    display: grid;
    grid-template-rows: repeat(8, 1fr);
    grid-template-columns: repeat(2, 2fr);
    grid-gap: 20px;
  } */
  display: grid;
  grid-gap: 30px;
  grid-auto-rows: 1fr;

  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;
