import PortalProjectDetail from "@/components/portal/PortalProjectDetail";

export default async function PortalProjectDetailPage({
  params,
}: Readonly<{
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  return <PortalProjectDetail projectId={projectId} />;
}
