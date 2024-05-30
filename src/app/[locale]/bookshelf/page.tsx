import SectionHeader from "@/components/custom/About/SectionHeader/sectionHeader";
import Book from "@/components/custom/BookShelf/book";
import Container from "@/components/custom/Common/Container/container";
import Main from "@/components/custom/Common/Main/main";
import { books } from "@/lib/constants";
import { twc } from "react-twc";

type Props = {
  params: { locale: string };
};

const Section = twc.section`w-full py-12 md:py-24 lg:py-32`;
const Grid = twc.div`container grid grid-cols-1 gap-8 px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-12`;

const Page: React.FC<Props> = ({ params: { locale } }: Props) => {
  return (
    <Main>
      <Container>
        <SectionHeader
          title="BookShelf"
          body="I love to read books and I have created a bookshelf where I can add books and read them."
        />
        <Section>
          <Grid>
            {books.map((book) => (
              <Book key={book.id} {...book} />
            ))}
          </Grid>
        </Section>
      </Container>
    </Main>
  );
};
export default Page;
