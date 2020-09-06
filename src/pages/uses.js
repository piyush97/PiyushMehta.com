import React from 'react';

import styled from '@xstyled/styled-components';
import { Seo } from '../containers/Seo';
import { SectionTitle, SectionDescription } from '../components/Section';
import { Card, CardBody, CardHeader } from '../components/Card';
import { PageContainer } from '../components/Container';

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
export default function Uses() {
  return (
    <>
      <Seo title="Piyush Mehta - Uses" />
      <PageContainer>
        <SectionTitle>Uses</SectionTitle>
        <SectionDescription>
          What I use to <strong>develop</strong> and <strong>Play</strong>.
        </SectionDescription>
        <Card
          forwardedAs="section"
          my={4}
          overflow="hidden"
          position="relative"
        >
          <CardHeader pr="40%">
            <CardTitle>Software</CardTitle>
          </CardHeader>
          <CardBody>
            <p>
              <li>
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
              </li>
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
                <Sectitle>Code Editor:</Sectitle>VSCode, find my configurations
                here{' '}
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
                <Sectitle>Password Manager & VPN:</Sectitle> DashLane
              </li>
              <li>
                My Clover BootLoader Configuration EFI and Plist is Available{' '}
                <Links>
                  <a href="https://github.com/piyush97/EFI">Here</a>
                </Links>
              </li>
            </p>
          </CardBody>
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
                13`&quot;` 2016 with TouchBar and Dell Xps 15
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
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B01MTDEYHU/ref=ppx_yo_dt_b_asin_title_o00_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    G.SKILL Trident Z RGB Series DDR4 Memory Module (8GB X 2pcs,
                    3200Mhz)
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B07FKNYHYX/ref=ppx_yo_dt_b_asin_title_o09_s01?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Corsair SPEC 05 CC-9011152-UK Mid Tower Red LED Cabinet with
                    VS650 PSU (Black)
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B07598HLB4/ref=ppx_yo_dt_b_asin_title_o07_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Intel Core i7-8700 Desktop Processor 6 Cores up to 4.6 GHz
                    LGA 1151 300 Series 95W
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B078211KBB/ref=ppx_yo_dt_b_asin_title_o05_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    1TB (Crucial)& 250 GB SSD (Corsair)
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B06ZZ6FMF8/ref=ppx_yo_dt_b_asin_title_o04_s01?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Sapphire 11265-05-20G Radeon Pulse RX 580 8GB GDDR5
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B079JF6NDC/ref=ppx_yo_dt_b_asin_title_o04_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    NZXT Kraken M22 CAM Powered 120 mm RGB AIO Liquid Cooler
                    with AER P Radiator-Optimized Fan
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B07HS59X7P/ref=ppx_yo_dt_b_asin_title_o03_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Gigabyte Z390 UD
                  </a>
                </Links>
                <br />
                <Links>
                  <a
                    href="https://www.amazon.in/gp/product/B07FNHTQNW/ref=ppx_yo_dt_b_asin_title_o08_s00?ie=UTF8&psc=1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Antec Prizm 120 ARGB 120mm Fans{' '}
                  </a>
                </Links>
                <br />
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
                <br />
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
