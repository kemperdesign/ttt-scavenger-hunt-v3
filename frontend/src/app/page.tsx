import React from "react";
import Link from "next/link";
import { listAdventures } from "@/lib/api";
import { HomeClient } from "@/components/player/HomeClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

async function getAdventures() {
  try {
    return await listAdventures();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const adventures = await getAdventures();
  return <HomeClient adventures={adventures} />;
}
