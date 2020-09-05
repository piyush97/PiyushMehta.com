import React, { useEffect } from 'react';

import styled, { up, css, keyframes } from '@xstyled/styled-components';
import { Seo } from '../containers/Seo';
import { SectionTitle, SectionDescription } from '../components/Section';
import { Card, CardBody, CardHeader, CardTitle } from '../components/Card';
import { PageContainer } from '../components/Container';
import { AdvancedReactLogo } from '../components/AdvancedReactLogo';

const rotation = keyframes`
  from {
    transform: translate(20%, 50%) perspective(200px) rotate(-20deg);
  }

  to {
    transform: translate(20%, 50%) perspective(200px) rotate(-5deg) rotateY(-5deg) scale(0.95);
  }
`;

const rotationMd = keyframes`
  from {
    transform: translate(20%, -32%) perspective(200px) rotate(-20deg);
  }

  to {
    transform: translate(20%, -32%) perspective(200px) rotate(-5deg) rotateY(-5deg) scale(0.95);
  }
`;

const Logo = styled(AdvancedReactLogo)`
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: auto;
  transform: translate(20%, 30%);
  animation: ${rotation} 5s ease-in-out infinite;
  animation-direction: alternate-reverse;

  ${up(
    'md',
    css`
      animation-name: ${rotationMd};
    `
  )}
`;

const CardTitleCustom = styled.h2`
  margin: 0;
  font-size: 50;
  color: lighter;
`;
const Links = styled.a`
  color: accent;
  text-decoration: underline;
`;
const Sectitle = styled.a`
  color: accent;
`;
export default function Uses() {
  useEffect(() => {
    document.oncontextmenu = () => {
      return false;
    };
  });
  return (
    <>
      <Seo title="Piyush Mehta - Skills" />
      <PageContainer>
        <SectionTitle>Skills</SectionTitle>
        <SectionDescription />
        <Card
          forwardedAs="section"
          my={6}
          overflow="hidden"
          position="relative"
        >
          <Logo />
          <CardHeader pr="40%">
            <CardTitleCustom>Skills</CardTitleCustom>
          </CardHeader>
          <CardBody>
            <div>
              <CardTitle>Softwares</CardTitle>
              <strong>
                Desktop Apps:{' '}
                <Links>
                  <a
                    href="https://github.com/piyush97/DotFiles/blob/master/packages/system_apps_list.txt"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    My System Apps
                  </a>
                </Links>
              </strong>
              <p>
                <li>
                  <Sectitle>Browser:</Sectitle>
                  <Links>
                    <a
                      href="https://brave.com/piy620"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {' '}
                      Brave Browser{' '}
                    </a>
                  </Links>{' '}
                  It helps me to make Dapps and it focus on your security!
                </li>

                <li>
                  <Sectitle>Code Editor:</Sectitle>VSCode, find my
                  configurations here{' '}
                  <Links>
                    <a
                      href="https://github.com/piyush97/dotfiles"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      GitHub/DotFiles
                    </a>{' '}
                  </Links>
                  with{' '}
                </li>
                <li>
                  <Sectitle>Font: </Sectitle>
                  Operator Mono font with Ligatures of Fira Code
                </li>
                <li>
                  <Sectitle>Design:</Sectitle> Sketch App and Figma
                </li>
                <li>
                  <Sectitle>Email:</Sectitle>
                  <Links>
                    <a
                      href="https://sparkmailapp.com/"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {' '}
                      Spark
                    </a>
                  </Links>
                </li>
                <li>
                  <Sectitle>Todos:</Sectitle>
                  <Links>
                    {' '}
                    <a
                      href="https://ticktick.com"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      TickTick
                    </a>
                  </Links>
                </li>
                <li>
                  <Sectitle>Terminal:</Sectitle>
                  <Links>
                    {' '}
                    <a
                      href="https://github.com/piyush97/dotfiles"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      iTerm2 with Oh-My-Zsh and Spaceship
                    </a>
                  </Links>
                </li>
                <li>
                  <Sectitle>Versioning and other tools:</Sectitle> Git, Github,
                  Bitbucket, Docker, Jira, Yarn, NPM
                </li>
                <li>
                  <Sectitle>Web Technologies and Frameworks:</Sectitle> React,
                  HTML5, JS(ES6), Java, Node.js, SpringBoot
                </li>
                <li>
                  <Sectitle>Styling: </Sectitle> CSS3, Sass, Styled Components,
                  Bootstrap, Foundation
                </li>
                <li>
                  <Sectitle>Databases & Data Structures:</Sectitle> MySQL,
                  MongoDB, Firebase, GraphQL, REST API / JSON
                </li>
                <li>
                  <Sectitle>Password Manager & VPN:</Sectitle> DashLane
                </li>
                <li>
                  I`&apos;`m a huge <Sectitle>Alfred</Sectitle> fan and i love
                  using it due to it`&apos;`s ease of use and PowerPack.
                </li>
                <li>
                  I currently use <Sectitle>Postman</Sectitle> for all my api
                  endpoints testing.
                </li>
              </p>
              <CardTitle>Hardware</CardTitle>
              <li>
                <Sectitle>Laptop: </Sectitle>MacBook Pro 13`&quot;` 2016 with
                TouchBar
              </li>
              <li>
                <Sectitle>Displays: (2 Lg Monitors) </Sectitle>
                <Links>
                  <a
                    href="https://www.lg.com/in/monitors/lg-27UK850"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    27UK850
                  </a>
                </Links>{' '}
                LG 4K UHD Monitor with HDR &{' '}
                <Links>
                  {' '}
                  <a
                    href="https://www.lg.com/in/monitors/lg-25UM58"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    25UM58
                  </a>
                </Links>{' '}
                21:9 UltraWide Monitor
              </li>
              <li>
                {' '}
                <Sectitle>PC: </Sectitle> I7-9k 16gb 32000mhz 8gb rx580{' '}
                <Links>
                  {' '}
                  <a
                    href="https://photos.app.goo.gl/P5FLbtwNw9ZeyuG36"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    (MY RIG)
                  </a>
                </Links>
              </li>
              <li>
                {' '}
                <Sectitle>Keyboard: </Sectitle>
                <Links>
                  <a
                    href="https://www.hyperxgaming.com/en/keyboards/alloy-elite-mechanical-gaming-keyboard"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Hyperx Elite RGB MX BLUE Keys
                  </a>
                </Links>
              </li>
              <li>
                <Sectitle>Tablet & Stylus: </Sectitle> iPad Pro 11`&quot;` 2019
                with Apple Pencil Gen 2
              </li>
              <li>
                <Sectitle>Watch: </Sectitle>Apple Watch series 5
              </li>
              <li>
                <Sectitle>Controller: </Sectitle>Xbox one Controller
              </li>
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    </>
  );
}
