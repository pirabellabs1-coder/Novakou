import FunnelEditorClient from "./FunnelEditorClient";

export default async function FunnelEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FunnelEditorClient id={id} />;
}
