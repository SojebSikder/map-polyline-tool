"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function ClientComponent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
     <div>
      <MapComponent title={title} description={description} />
    </div>
  );
}


