import { LeadDetail } from "@/components/admin/lead-detail";

export const metadata = { title: "Detalhes do lead" };

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetail id={id} />;
}
