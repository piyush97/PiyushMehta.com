import { socials } from "@/lib/routes";
import {
  EnvelopeClosedIcon,
  GitHubLogoIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import { FC, memo } from "react";

/**
 * Represents the social media icons of the website.
 * This component displays the social media icons.
 */
const Socials: FC = () => {
  const icons = {
    Twitter: (
      <TwitterLogoIcon className="w-6 h-6 hover:text-primary transition-colors" />
    ),
    GitHub: (
      <GitHubLogoIcon className="w-6 h-6 hover:text-primary transition-colors" />
    ),
    Linkedin: (
      <LinkedInLogoIcon className="w-6 h-6 hover:text-primary transition-colors" />
    ),
    Instagram: (
      <InstagramLogoIcon className="w-6 h-6 hover:text-primary transition-colors" />
    ),
    Email: (
      <EnvelopeClosedIcon className="w-6 h-6 hover:text-primary transition-colors" />
    ),
  };

  return (
    <div className="flex space-x-4">
      {socials.map(({ name, url }) => (
        <a key={name} href={url} target="_blank" rel="noreferrer">
          {icons[name]}
        </a>
      ))}
    </div>
  );
};

export default memo(Socials);
