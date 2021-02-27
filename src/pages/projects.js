/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { ProjectsPageTemplate, ShineTag } from '../containers/Projects';

export default function ProjectsPage() {
  return (
    <ProjectsPageTemplate
      title="Projects"
      intro={
        <>
          Open source is a real passion and a way of thinking. I've made many
          <strong> Dashboards</strong> and <strong>Web Apps</strong> with strong
          architecture, great UX and bleeding edge tech for clients and
          companies worldwide
        </>
      }
      projects={{
        'piyushmehta.com': {
          label: 'My Personal Website',
          description: (
            <>
              PiyushMehta.com is a <strong>premium JAMStack Website</strong>. I
              publish my learnings as blogs on this website. Its Open Source and
              you can make your own version of it!
            </>
          ),
        },
        Netflix: {
          label: 'Netflix Typescript React',
          description: (
            <>
              Netflix Typescript Clone is a sample app for devs to learn the
              <ShineTag key="createdAt"> Best Practices</ShineTag> while
              developing a Typescript React App.
            </>
          ),
        },
        Nuclei: {
          label: 'Gonuclei.com',
          description: (
            <>
              gonuclei.com is a beautiful blend of GraphQL, Gatsby and
              <strong> Contentful CMS.</strong>
            </>
          ),
        },
        Meaww: {
          label: 'Meaww Influencers Dashboard',
          description: (
            <>
              A complete Comprehensive dashboard built for the influencers. Used
              to track their <strong>growth and reach.</strong>
            </>
          ),
        },
        GoGitter: {
          label: 'Challenge using GitHub Api',
          description: (
            <>
              Go Gitter helps you challenge yourself to contribute more on{' '}
              <strong>open source</strong>
            </>
          ),
        },
        Zapify: {
          label: 'UI Component Library',
          description: (
            <>
              Zapify is blazing fast Component Library built out of{' '}
              <strong>Flexbox and React Hooks</strong>
            </>
          ),
        },
        GitApp: {
          label: 'GitHub Repository Search Impl',
          description: (
            <>Elastic Search Implementation for Github Repositories</>
          ),
        },
        AidApp: {
          label: 'Order Management App',
          description: (
            <>
              With Saledrive, worry less about sales management. Coordinate with
              your team in a hassle-free manner. No more guesswork; everyone
              knows what they are doing. You can signup for a free trial as an
              organisation in less than a minute, add your team members, focus
              on what's most important and -- get work done!
            </>
          ),
        },
        Quickstagram: {
          label: 'React Instagram Clone',
          description: (
            <>Instagram Implementation with TailwindCSS, React and Firebase</>
          ),
        },
      }}
    />
  );
}
