import React from 'react';
import styled, {
  keyframes,
  th,
  css,
  Box,
  useColorMode,
} from '@xstyled/styled-components';
import { format } from 'date-fns';
import Img from 'gatsby-image';
import { useStaticQuery, graphql } from 'gatsby';
import humanNumber from 'human-number';
// import N from '../images/N.webp';
import { FaGithub } from 'react-icons/fa';
import { Seo } from './Seo';
import { SectionTitle, SectionDescription } from '../components/Section';
import { PageContainer } from '../components/Container';
import { ProjectShape } from '../components/Project';
import { Card, CardBody, CardText } from '../components/Card';

const rotateRight = keyframes`
  from {
    transform: rotate(0deg)
               perspective(200px)
               translateZ(-8px)
               rotateY(2deg)
               translate(0px)
               rotate(0deg);
  }
  to {
    transform: rotate(360deg)
               perspective(200px)
               translateZ(-8px)
               rotateY(2deg)
               translate(0px) 
               rotate(-360deg);
  }
`;

const ProjectImageLink = styled.a`
  display: block;
  position: relative;
  width: 30%;
  padding-top: 3%;

  animation: ${rotateRight} 5s linear infinite;

  > svg {
    position: absolute;
    transition: base;
    top: 0;
    width: 118%;
    height: auto;
  }
`;

const ProjectLabel = styled.div`
  font-family: monospace;
  font-size: 13;
  color: accent;
`;

const ProjectTitle = styled.h3`
  margin: 0;
  font-weight: 500;
  font-size: 22;
  color: lighter;
  margin-bottom: 3;
  margin-right: 3;

  > a {
    transition: base;

    &:hover {
      color: accent;
    }
  }
`;

const ProjectBody = styled.div`
  position: relative;
  z-index: 1;
  max-width: 70%;
  flex: 0 0 70%;
`;

const ProjectTags = styled.ul`
  margin: 0;
  padding: 0;
  margin-top: 3;
  font-family: monospace;
`;

const Project = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  transition: base;

  ${(p) => {
    switch (p.position) {
      case 'right':
        return css`
          text-align: left;
          flex-direction: row-reverse;

          ${ProjectLabel}, ${ProjectTitle} {
            margin-left: 3;
          }

          ${ProjectTags} {
            margin-left: 2;
          }

          ${ProjectImageLink} {
            padding-right: 6.5%;
            animation-direction: normal;

            > svg {
              right: 0;
            }
          }

          ${ProjectImageLink}:hover > svg {
            transform: scale(1.05);
          }
        `;
      case 'left':
      default:
        return css`
          text-align: right;
          flex-direction: row;

          ${ProjectLabel}, ${ProjectTitle} {
            margin-right: 3;
          }

          ${ProjectTags} {
            margin-right: 2;
          }

          ${ProjectImageLink} {
            padding-left: 6.5%;
            animation-direction: reverse;

            > svg {
              left: 0;
            }
          }

          ${ProjectImageLink}:hover > svg {
            transform: scale(1.05);
          }
        `;
    }
  }}
`;

const ProjectTag = styled.li`
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: inline-block;
  font-size: 12;
  color: light400;
  padding: 0 2;

  a {
    transition: base;
    color: lighter;

    > svg {
      font-size: 18;
      vertical-align: middle;
    }

    &:hover {
      color: accent;
    }
  }
`;

const shine = keyframes`
  0%, 20% { mask-position: -50%; }
  80%, 100% { mask-position: 150%; }
`;

const pulse = keyframes`
  0% {
    text-shadow: 0 0 2px ${th.color('accent')};
  }
  
  20%, 60% {
    text-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  
  80% {
    text-shadow: 0 0 2px ${th.color('accent')};
  }
`;

export const ShineTag = styled(ProjectTag)`
  cursor: help;
  color: accent;
  mask-image: linear-gradient(
    -75deg,
    rgba(0, 0, 0, 0.6) 30%,
    #000 50%,
    rgba(0, 0, 0, 0.6) 70%
  );
  mask-size: 200%;
  animation: ${shine} 3s linear infinite, ${pulse} 3s infinite;
`;

function ProjectDescription({ children }) {
  return (
    <Card>
      <CardBody>
        <CardText>{children}</CardText>
      </CardBody>
    </Card>
  );
}

function ProjectTemplate({
  github,
  npm,
  position,
  label,
  title,
  url,
  description,
  tags,
  color,
  logo,
  isGithub,
  stats = true,
}) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (!stats) return;
    Promise.all([
      isGithub && github
        ? fetch(
            github.replace('https://github.com', 'https://api.github.com/repos')
          ).then((res) => res.json())
        : 0,
    ])
      .then(setData)
      .catch(() => {
        // ignore errors
      });
  }, [stats, npm, github]);

  const stars = stats && isGithub && github && (
    <ShineTag key="stars" title="Number of stars on GitHub">
      ★ {data ? `${humanNumber(Math.floor(data[0].stargazers_count))}+` : '.'}
    </ShineTag>
  );

  const downloads = stats && isGithub && (
    <ShineTag key="downloads" title="No of Forks">
      ↓ {data ? `${humanNumber(Math.floor(data[0].forks))}+` : '.'}
    </ShineTag>
  );
  const createdDate = stats && isGithub && (
    <ShineTag key="createdAt" title="Date Project was created">
      {data && data[0].created_at
        ? `${format(
            new Date(data[0].created_at),
            "'Created at', do MMMM yyyy"
          )}`
        : '.'}
    </ShineTag>
  );

  const language = stats && isGithub && (
    <ShineTag key="language" title="Language">
      {data ? `${data[0].language}` : '.'}
    </ShineTag>
  );

  const ghTag = github ? (
    <ProjectTag key="github">
      <a href={github}>
        <FaGithub />
      </a>
    </ProjectTag>
  ) : null;

  return (
    <Project position={position}>
      <ProjectImageLink href={url}>
        <ProjectShape position={position} color={color} />
        <img src={logo} />
      </ProjectImageLink>
      <ProjectBody>
        <ProjectLabel>{label}</ProjectLabel>
        <ProjectTitle>
          <a href={url}>{title}</a>
        </ProjectTitle>
        <ProjectDescription>{description}</ProjectDescription>
        <ProjectTags>
          {position === 'right' && ghTag}
          {position === 'right' && createdDate}
          {position === 'right' && language}
          {position === 'right' && stars}
          {position === 'right' && downloads}
          {tags.map((tag, index) => (
            <ProjectTag key={index}>{tag}</ProjectTag>
          ))}
          {position === 'left' && downloads}
          {position === 'left' && stars}
          {position === 'left' && language}
          {position === 'left' && createdDate}
          {position === 'left' && ghTag}
        </ProjectTags>
      </ProjectBody>
    </Project>
  );
}

function Projects({ projects }) {
  const projectElements = [
    <ProjectTemplate
      logo={''}
      label={projects['piyushmehta.com'].label}
      title="PiyushMehta.com"
      isGithub={true}
      github="https://github.com/piyush97/PiyushMehta.com"
      url="https://github.com/piyush97/PiyushMehta.com"
      color="#667EEA"
      description={projects['piyushmehta.com'].description}
      tags={['GatsbyJs', 'GraphQL']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['Netflix'].label}
      title="Netflix TypeScript Clone"
      isGithub={true}
      github="https://github.com/piyush97/Netflix-React-Clone"
      url="https://netflix-reactjs-clone.netlify.app/"
      color="#E50914"
      description={projects['Netflix'].description}
      tags={['TypeScript', 'React']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['Nuclei'].label}
      title="GoNuclei.com"
      isGithub={false}
      url="https://gonuclei.com/"
      color="#0092EB"
      description={projects['Nuclei'].description}
      tags={['Gatsby', 'GraphQL', 'Contentful']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['Meaww'].label}
      title="Dashboard"
      isGithub={false}
      url="https://meaww.com/"
      color="#000"
      description={projects['Meaww'].description}
      tags={['React', 'Redux']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['GoGitter'].label}
      title="GoGitter"
      github="https://github.com/piyush97/GoGitter"
      isGithub={true}
      url="https://gogitter-16d93.web.app/"
      color="#fbfbfb"
      description={projects['GoGitter'].description}
      tags={['React', 'Redux']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['Zapify'].label}
      title="Zapify"
      github="https://github.com/zapify-ui/zapify"
      isGithub={true}
      url="https://zapify-ui.github.io/"
      color="#6C2478"
      description={projects['Zapify'].description}
      tags={['React', 'Webpack', 'SASS']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['GitApp'].label}
      title="GitApp"
      github="https://github.com/piyush97/GitApp"
      isGithub={true}
      url="https://whispering-island-83455.herokuapp.com/"
      color="#00CDCD"
      description={projects['GitApp'].description}
      tags={['React', 'ElasticSearch', 'SASS']}
    />,
    <ProjectTemplate
      logo={''}
      label={projects['AidApp'].label}
      title="Saledrive - Sales Management Made Easy"
      // github="https://github.com/piyush97/GitApp"
      isGithub={false}
      url="https://play.google.com/store/apps/details?id=com.aidapp.saledrive&hl=en_GB"
      color="#fff"
      description={projects['AidApp'].description}
      tags={['Ionic', 'Sass', 'React']}
    />,
  ];
  return (
    <Box mt={5} row mb={{ xs: -4, md: -5 }}>
      {projectElements.map((project, index) => (
        <Box col={1} py={{ xs: 4, md: 5 }} key={index}>
          {React.cloneElement(project, {
            position: index % 2 === 0 ? 'left' : 'right',
          })}
        </Box>
      ))}
    </Box>
  );
}

export function ProjectsPageTemplate({ title, intro, projects }) {
  return (
    <>
      <Seo title={`Piyush Mehta - ${title}`} />
      <PageContainer>
        <SectionTitle>{title}</SectionTitle>
        <SectionDescription>{intro}</SectionDescription>
        <Projects projects={projects} />
      </PageContainer>
    </>
  );
}
