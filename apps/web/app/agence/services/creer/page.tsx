import { ServiceWizard } from "@/components/services/wizard/ServiceWizard";

export const metadata = {
  title: "Créer un service | Agence FreelanceHigh",
  description: "Créez et publiez un service pour votre agence sur FreelanceHigh",
};

export default function CreateAgencyServicePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServiceWizard role="agency" />
    </div>
  );
}
