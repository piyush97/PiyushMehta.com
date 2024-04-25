import { Button } from "@/components/ui/button";
import { AUTHOR_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
type Props = {};

const Hero = (props: Props) => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Hi, I'm {AUTHOR_NAME}
              </h1>
              <h2 className="text-2xl font-semibold text-gray-500 dark:text-gray-400 sm:text-3xl">
                I'm a software developer
              </h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                I specialize in building modern, responsive web applications
                using the latest technologies. With over 3 years of experience,
                I have honed my skills in JavaScript, React, Node.js, and more.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                className="inline-flex h-10 items-center justify-center"
                href="#"
              >
                <Button
                  variant="ghost"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                >
                  {" "}
                  View Projects
                </Button>
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center"
                href="#"
              >
                <Button
                  variant="ghost"
                  className=" rounded-md border border-gray-200 border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                >
                  Contact Me
                </Button>
              </Link>
            </div>
          </div>
          <Image
            alt="Hero"
            className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
            height="550"
            src="/hero.png"
            width="550"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
