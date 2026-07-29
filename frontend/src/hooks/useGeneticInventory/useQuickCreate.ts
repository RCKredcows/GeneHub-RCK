import { useCallback } from 'react';
import { useSireForm } from '../useSires/useSireForm';
import { useCustomerForm } from '../useCustomers/useCustomerForm';
import { useTankForm } from '../useTanks/useTankForm';
import { useCanisterForm } from '../useTanks/useCanisterForm';
import type { useInventoryForm } from './useInventoryForm';

type InventoryFormRef = Pick<ReturnType<typeof useInventoryForm>, 'setFormData' | 'setSelectedSire' | 'setSelectedCustomer' | 'formData'>;

interface DependenciesRef {
  refreshSires: () => void;
  refreshTanks: () => void;
  fetchCanistersForTank: (tankId: string) => void;
  tanks: Array<{ id: string; [key: string]: unknown }>;
}

interface QuickCreateOptions {
  inventoryForm: InventoryFormRef;
  dependencies: DependenciesRef;
  userId?: string;
}

/**
 * Consolidates all quick create functionality for the GeneticInventory page.
 * Manages sire, customer, tank, and canister quick create forms.
 */
export function useQuickCreate({ inventoryForm, dependencies, userId }: QuickCreateOptions) {
  // Success handlers - refresh data and auto-select the new item
  const handleSireCreated = useCallback(async (newSire?: unknown) => {
    await dependencies.refreshSires();
    const sire = newSire as { id: string; name: string; breed?: string; price_for_semen?: string } | null | undefined;
    if (sire?.id) {
      // Auto-populate sire_id, breed, and price like handleInputChange does
      inventoryForm.setFormData(prev => ({
        ...prev,
        sire_id: sire.id,
        breed: sire.breed || prev.breed,
        price_for_semen: sire.price_for_semen || prev.price_for_semen
      }));
      // Set selected sire for display in AsyncSearchableSelect
      inventoryForm.setSelectedSire(sire);
    }
  }, [dependencies, inventoryForm]);

  const handleCustomerCreated = useCallback(async (newCustomer?: unknown) => {
    const customer = newCustomer as { id: string; name: string } | null | undefined;
    if (customer?.id) {
      inventoryForm.setFormData(prev => ({ ...prev, customer_id: customer.id }));
      // Set selected customer for display in AsyncSearchableSelect
      inventoryForm.setSelectedCustomer(customer);
    }
  }, [inventoryForm]);

  const handleTankCreated = useCallback(async (newTank?: unknown) => {
    await dependencies.refreshTanks();
    const tank = newTank as { id: string } | null | undefined;
    if (tank?.id) {
      inventoryForm.setFormData(prev => ({ ...prev, tank_id: tank.id, canister_id: null }));
    }
  }, [dependencies, inventoryForm]);

  const handleCanisterCreated = useCallback(async (newCanister?: unknown, tankId?: unknown) => {
    await dependencies.fetchCanistersForTank(tankId as string);
    const canister = newCanister as { id: string } | null | undefined;
    if (canister?.id) {
      inventoryForm.setFormData(prev => ({ ...prev, canister_id: canister.id }));
    }
  }, [dependencies, inventoryForm]);

  // Form hooks - pass userId for activity logging
  const sireForm = useSireForm(handleSireCreated, userId);
  const customerForm = useCustomerForm(handleCustomerCreated, userId);
  const tankForm = useTankForm(handleTankCreated, dependencies.tanks, userId);
  const canisterForm = useCanisterForm(handleCanisterCreated, null, userId);

  // Open handlers
  const openSireForm = useCallback(() => {
    sireForm.setIsFormOpen(true);
  }, [sireForm]);

  const openCustomerForm = useCallback(() => {
    customerForm.setIsFormOpen(true);
  }, [customerForm]);

  const openTankForm = useCallback(() => {
    tankForm.setIsFormOpen(true);
  }, [tankForm]);

  const openCanisterForm = useCallback(() => {
    const selectedTank = dependencies.tanks.find(t => t.id === inventoryForm.formData.tank_id);
    if (selectedTank) {
      canisterForm.handleOpenCanisterForm(selectedTank as { id: string; tank_name: string });
    }
  }, [canisterForm, dependencies.tanks, inventoryForm.formData.tank_id]);

  return {
    // Open handlers for SearchableSelect onCreateNew
    openSireForm,
    openCustomerForm,
    openTankForm,
    openCanisterForm,

    // Form props for rendering modals
    sire: {
      isOpen: sireForm.isFormOpen,
      selectedCustomer: sireForm.selectedCustomer,
      formData: sireForm.formData,
      loading: sireForm.loading,
      error: sireForm.error,
      imagePreview: sireForm.imagePreview,
      validation: sireForm.validation,
      onInputChange: sireForm.handleInputChange,
      onImageChange: sireForm.handleImageChange,
      onRemoveImage: sireForm.handleRemoveImage,
      onSubmit: sireForm.handleSubmit,
      onClose: sireForm.handleCloseForm,
    },

    customer: {
      isOpen: customerForm.isFormOpen,
      formData: customerForm.formData,
      loading: customerForm.loading,
      error: customerForm.error,
      validation: customerForm.validation,
      onInputChange: customerForm.handleInputChange,
      onSubmit: customerForm.handleSubmit,
      onClose: customerForm.handleCloseForm,
    },

    tank: {
      isOpen: tankForm.isFormOpen,
      formData: tankForm.formData,
      loading: tankForm.loading,
      error: tankForm.error,
      validation: tankForm.validation,
      onInputChange: tankForm.handleInputChange,
      onSubmit: tankForm.handleSubmit,
      onClose: tankForm.handleCloseForm,
    },

    canister: {
      isOpen: canisterForm.isCanisterFormOpen,
      selectedTank: canisterForm.selectedTankForCanister,
      formData: canisterForm.canisterFormData,
      loading: canisterForm.loading,
      error: canisterForm.error,
      validation: canisterForm.validation,
      onInputChange: canisterForm.handleCanisterInputChange,
      onSubmit: canisterForm.handleCanisterSubmit,
      onClose: canisterForm.handleCloseCanisterForm,
    },
  };
}
