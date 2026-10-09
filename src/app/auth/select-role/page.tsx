import AuthLayout from "@/components/ui/AuthLayout";
import RoleSelection from "./RoleSelection";

export const metadata = {
  title: "Choose your role | ConstructPro ERP",
  robots: { index: false, follow: false },
};

export default function SelectRolePage() {
  return (
    <AuthLayout>
      <RoleSelection />
    </AuthLayout>
  );
}
