import { BIO, IMG_CDN } from "@/lib/constants";
import Image from "next/image";
import { FC, memo } from "react";
import HeroTitle from "./herotitle";
import Linkbar from "./linkbar";

/**
 * Represents the hero component of the website.
 */
const Hero: FC = () => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <HeroTitle bio={BIO} />
            <Linkbar />
          </div>
          <Image
            alt="Hero"
            className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
            height={550}
            src={IMG_CDN}
            width={550}
          />
        </div>
      </div>
    </section>
  );
};

export default memo(Hero);
