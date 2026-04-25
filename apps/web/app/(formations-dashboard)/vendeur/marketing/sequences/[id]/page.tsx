import SequenceEditorClient from "./SequenceEditorClient";

export default async function SequenceEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SequenceEditorClient id={id} />;
}
