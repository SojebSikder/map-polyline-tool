"use client";
// import ClientComponent from "./Components/ClientComponent";

// // title
// const title = "Map polyline tool";
// // description
// const description =
//   "A tool for polyline drawing.";
// // keywords
// const keywords = [
//   "Polyline Drawing",
//   "Map",
// ];

// export const metadata = {
//   title,
//   description,
//   keywords: keywords.join(", "),
// };

import dynamic from "next/dynamic";

const ClientMap = dynamic(() => import("./Components/ClientComponent"), { ssr: false });

export default function Home() {
  return (
    <div>
      {/* <ClientComponent /> */}
      <ClientMap />
    </div>
  );
}
