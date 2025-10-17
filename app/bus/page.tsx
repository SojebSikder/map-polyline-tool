import ClientComponent from "./Components/ClientComponent";

const title = "Bus fare app";
const description = "A web app for get bus fare with route.";

export const metadata = {
  title,
  description,
};

export default function Home() {
  return (
    <ClientComponent title={title} description={description} />
  );
}
