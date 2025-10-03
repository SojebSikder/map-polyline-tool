"use client";

import dynamic from "next/dynamic";

const ClientMap = dynamic(() => import("./Map/MapComponent"), { ssr: false });

export default function ClientComponent() {
  return (
     <div>
      <ClientMap />
    </div>
  );
}


