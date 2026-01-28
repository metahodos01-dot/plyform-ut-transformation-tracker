import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface CompanyFilterProps {
    selectedCompany: string;
    onSelectCompany: (id: string) => void;
}

export function CompanyFilter({ selectedCompany, onSelectCompany }: CompanyFilterProps) {
    const { userData } = useAuth();

    if (!userData || userData.role !== 'GROUP_DIRECTOR') {
        return null; // Only Director sees this
    }

    const companies = [
        { id: 'all', name: 'All Companies' },
        { id: 'company_1', name: 'Company 1' },
        { id: 'company_2', name: 'Company 2' },
        { id: 'company_3', name: 'Company 3' },
    ];

    return (
        <div className="flex space-x-2 mb-6">
            {companies.map(c => (
                <Button
                    key={c.id}
                    variant={selectedCompany === c.id ? "default" : "outline"}
                    onClick={() => onSelectCompany(c.id)}
                    size="sm"
                >
                    {c.name}
                </Button>
            ))}
        </div>
    );
}
