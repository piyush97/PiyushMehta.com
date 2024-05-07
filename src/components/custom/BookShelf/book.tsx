import Heading from "@/components/custom/BookShelf/heading";
import type { Book } from "@/lib/types";
import Image from "next/image";
import React from "react";
import { twc } from "react-twc";

const BookComponent = twc.div`group relative overflow-hidden rounded-lg`;
const BookGrid = twc.div`grid grid-cols-2 gap-4`;
const BookRibbon = twc.div`absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100`;
const BookCover = twc(
  Image
)`aspect-[2/3] w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105`;

const Book: React.FC<Book> = ({ title, subtitle, quote, coverUrl }) => (
  <div className="space-y-6">
    <Heading title={title} subtitle={subtitle} />
    <BookGrid>
      <BookComponent>
        <BookRibbon>
          <div className="rounded-lg bg-gray-900/80 px-4 py-2 text-white shadow-lg backdrop-blur-sm">
            <p className="text-sm">{quote}</p>
          </div>
        </BookRibbon>
        <BookCover alt="Book Cover" height={450} src={coverUrl} width={300} />
      </BookComponent>
    </BookGrid>
  </div>
);

export default Book;
