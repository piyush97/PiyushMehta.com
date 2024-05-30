import { GithubIcon, LinkedinIcon } from "lucide-react";
import Link from "next/link";

const Page: React.FC = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Piyush Mehta</h1>
            <div className="flex items-center gap-4"></div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="#"
            >
              <LinkedinIcon className="w-5 h-5" />
              <span className="text-sm">LinkedIn</span>
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="#"
            >
              <GithubIcon className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </Link>
          </div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Experienced software engineer with a passion for building scalable and
          efficient web applications. Proficient in JavaScript, React, and
          Node.js, with a strong understanding of modern web development
          practices.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-2xl font-bold mb-4">Work Experience</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Software Consultant</h3>
              <p className="text-gray-500 dark:text-gray-400">
                BDO Canada LLP | 2023 - Present
              </p>
              <ul className="mt-2 space-y-2 list-disc pl-5">
                <li>
                  Developed and maintained complex web applications using React,
                  Node.js, Next.js, Typescript, SQL Server and Open AI API.
                </li>
                <li>
                  Collaborated with cross-functional teams to design and
                  implement new features.
                </li>
                <li>
                  Optimized application performance and scalability through code
                  refactoring and infrastructure improvements.
                </li>
                <li>
                  Participated in agile development processes, including sprint
                  planning, code reviews, and retrospectives.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Full Stack Developer</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Nuclei | 2020 - 2021
              </p>
              <ul className="mt-2 space-y-2 list-disc pl-5">
                <li>
                  Developed and maintained responsive web pages using HTML, CSS,
                  and JavaScript.
                </li>
                <li>
                  Collaborated with designers to implement user interface
                  designs.
                </li>
                <li>
                  Participated in code reviews and learned best practices for
                  web development.
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">Education</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">
                Masters of Applied Computing
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                University of Windsor | 2022 - 2023
              </p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Graduated with a GPA of 3.8
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">
                Bachelor of Engineering in Information Science
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ramaiah Institute of Technology | 2016 - 2020
              </p>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Graduated with a GPA of 3.4
              </p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">Skills</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
              <h3 className="text-md font-semibold mb-2">
                Programming Languages
              </h3>
              <ul className="space-y-1 text-gray-500 dark:text-gray-400">
                <li>JavaScript</li>
                <li>TypeScript</li>
                <li>HTML</li>
                <li>CSS</li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
              <h3 className="text-md font-semibold mb-2">
                Frameworks and Libraries
              </h3>
              <ul className="space-y-1 text-gray-500 dark:text-gray-400">
                <li>React</li>
                <li>Node.js</li>
                <li>Express</li>
                <li>Redux</li>
                <li>Next.js</li>
                <li>Nest.js</li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
              <h3 className="text-md font-semibold mb-2">
                Tools and Technologies
              </h3>
              <ul className="space-y-1 text-gray-500 dark:text-gray-400">
                <li>Git</li>
                <li>MongoDB</li>
                <li>PostgreSQL</li>
                <li>GraphQL</li>
                <li>REST</li>
                <li>CI/CD</li>
                <li>Docker</li>
                <li>Azure</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page;
