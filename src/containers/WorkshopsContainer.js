import { Box } from '@xstyled/styled-components';
import React from 'react';
import { Card, CardBody, CardTitle } from '../components/Card';
import { TalksData } from '../constants/Talks';

const WorkshopsContainer = () => {
  return (
    <Box>
      {TalksData.map(({ id, venue, topic, photo, date }) => (
        <Card key={id}>
          <CardBody>
            <CardTitle>{topic}</CardTitle>
            <Img fluid={photo} draggable={false} />
            {venue}
          </CardBody>
        </Card>
      ))}
    </Box>
  );
};

export default WorkshopsContainer;
