import { FEATURE_ROUTES } from "@/utils/constants";

import { FeatureShell } from "@/components/layout/feature-shell";

type FeaturePageProps = Readonly<{
  href: (typeof FEATURE_ROUTES)[number]["href"];
}>;

export function FeaturePage({ href }: FeaturePageProps) {
  const feature = FEATURE_ROUTES.find((item) => item.href === href);

  if (!feature) {
    return <FeatureShell title="Coming Soon" description="Feature module is not configured yet." />;
  }

  return <FeatureShell title={feature.title} description={feature.pageDescription} />;
}
