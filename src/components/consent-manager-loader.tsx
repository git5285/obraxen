"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/dictionaries/types";

type ConsentManagerLoaderProps = {
  analyticsAvailable: boolean;
  copy: Dictionary["consent"];
  cookieUrl: string;
  privacyUrl: string;
};

const LazyConsentManager = dynamic(() =>
  import("./consent-manager").then((module) => module.ConsentManager),
);

export function ConsentManagerLoader(props: ConsentManagerLoaderProps) {
  if (!props.analyticsAvailable) return null;
  return <LazyConsentManager {...props} />;
}
