import { ServiceWizard } from "@/components/services/wizard/ServiceWizard";

export const metadata = {
  title: "Créer un service | FreelanceHigh",
  description: "Créez et publiez votre service sur FreelanceHigh",
};

export default function CreateServicePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServiceWizard role="freelance" />
    </div>
  );
}
