import styled from '@xstyled/styled-components';
import React from 'react';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageContainer } from '../components/Container';
import { SectionDescription, SectionTitle } from '../components/Section';
import { Seo } from '../containers/Seo';

const CardTitle = styled.h2`
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
        <Card
          forwardedAs="section"
          my={4}
          overflow="hidden"
          position="relative"
        >
          <CardHeader pr="40%">
            <CardTitle>Docker Workshop</CardTitle>
          </CardHeader>
          <CardBody>{/* <Image fluid="test" />{' '} */}</CardBody>
        </Card>
        <Card
          forwardedAs="section"
          my={4}
          overflow="hidden"
          position="relative"
        >
          <CardHeader pr="40%">
            <CardTitle>Hardware</CardTitle>
          </CardHeader>
          <CardBody>
            <div>
              <li>
                <Sectitle>Mobile Computing Drivers: </Sectitle>MacBook Pro
                13&quot; 2016 with TouchBar and Dell Xps 15
              </li>
              <li>
                <Sectitle>Displays: (2 Monitors) </Sectitle>
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
              <hr />

              <li>
                <Sectitle>
                  PC: <br />
                </Sectitle>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B01MTDEYHU/ref=ppx_yo_dt_b_asin_title_o00_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      G.SKILL Trident Z DDR4
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B07598HLB4/ref=ppx_yo_dt_b_asin_title_o07_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Intel Core i7-8700
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B078211KBB/ref=ppx_yo_dt_b_asin_title_o05_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      1TB (Crucial) & 250 GB SSD (Corsair)
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B06ZZ6FMF8/ref=ppx_yo_dt_b_asin_title_o04_s01?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      RX 580 8GB GDDR5
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B079JF6NDC/ref=ppx_yo_dt_b_asin_title_o04_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      NZXT Kraken M22
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B07HS59X7P/ref=ppx_yo_dt_b_asin_title_o03_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Gigabyte Z390 UD
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="https://www.amazon.in/gp/product/B07FNHTQNW/ref=ppx_yo_dt_b_asin_title_o08_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Antec Prizm 120 ARGB 120mm Fans{' '}
                    </a>
                  </Links>
                </li>
                <li>
                  <Links>
                    <a
                      href="
                    https: //www.amazon.in/gp/product/B01IFGFTJ2/ref=ppx_yo_dt_b_asin_title_o01_s00?ie=UTF8&psc=1"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      NZXT Internal USB Hub
                    </a>
                  </Links>
                </li>
                <li>
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
              </li>
              <hr />
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
                <li>
                  <Sectitle>Mouse: </Sectitle>
                  <Links>
                    <a
                      href="https://www.logitech.com/en-in/products/mice/mx-master-3.html"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Logitech MX Master 3
                    </a>
                  </Links>
                </li>
              </li>
              <li>
                <Sectitle>Tablet & Stylus: </Sectitle> iPad Pro 11&quot; 2019
                with Apple Pencil Gen 2
              </li>
              <li>
                <Sectitle>Watch: </Sectitle>Apple Watch series 5 and Series 6
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
