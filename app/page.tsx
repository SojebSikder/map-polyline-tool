import ClientComponent from "./Components/ClientComponent";

// title
const title = "Map polyline tool";
// description
const description =
  "A tool for polyline drawing.";
// keywords
const keywords = [
  "Polyline Drawing",
  "Map",
];

export const metadata = {
  title,
  description,
  keywords: keywords.join(", "),
};

export default function Home() {
  return (
    <div>
      <ClientComponent />
    </div>
  );
}
