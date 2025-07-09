
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, User, ChevronDown, Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import CreateCompanyModal from './CreateCompanyModal';

export default function CompanySelector() {
  const { currentCompany, userCompanies, isCompanyMode, switchToCompany, switchToIndividual } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="glass-button w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isCompanyMode ? (
              <>
                <Building2 className="h-4 w-4" />
                <span>{currentCompany?.name}</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Individual Account</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <Card className="absolute top-12 left-0 right-0 z-50 enhanced-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">Switch Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={!isCompanyMode ? "secondary" : "ghost"}
                onClick={() => {
                  switchToIndividual();
                  setIsOpen(false);
                }}
                className="w-full justify-start glass-button"
              >
                <User className="h-4 w-4 mr-2" />
                Individual Account
                {!isCompanyMode && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </Button>

              {userCompanies.map((company) => (
                <Button
                  key={company.id}
                  variant={currentCompany?.id === company.id ? "secondary" : "ghost"}
                  onClick={() => {
                    switchToCompany(company.id);
                    setIsOpen(false);
                  }}
                  className="w-full justify-start glass-button"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {company.name}
                  {currentCompany?.id === company.id && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                </Button>
              ))}

              <div className="pt-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full justify-start glass-button text-blue-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
