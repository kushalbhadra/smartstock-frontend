import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PurchaseOrdersPage from './PurchaseOrdersPage';

const mocks = vi.hoisted(() => ({
    getOrders: vi.fn(),
    getWarehouses: vi.fn(),
    getSuppliers: vi.fn(),
    getActiveProducts: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/purchaseOrderApi', () => ({
    purchaseOrderApi: { getAll: mocks.getOrders },
}));
vi.mock('../api/warehouseApi', () => ({
    warehouseApi: { getAll: mocks.getWarehouses },
}));
vi.mock('../api/supplierApi', () => ({
    supplierApi: {
        getAll: mocks.getSuppliers,
        getActiveProducts: mocks.getActiveProducts,
    },
}));
vi.mock('../context/useAuth', () => ({
    useAuth: () => ({
        canMutate: true,
        isAdmin: true,
        isManager: false,
        warehouseId: null,
    }),
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));

describe('PurchaseOrdersPage supplier-product selection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getOrders.mockResolvedValue([]);
        mocks.getWarehouses.mockResolvedValue([
            { id: 1, name: 'Main Warehouse' },
        ]);
        mocks.getSuppliers.mockResolvedValue([
            { id: 10, name: 'Supplier A', rating: 4, active: true },
            { id: 20, name: 'Supplier B', rating: 4, active: true },
        ]);
        mocks.getActiveProducts.mockImplementation(async (supplierId: number) =>
            supplierId === 10
                ? [{ productId: 31, productName: 'Widget', sku: 'W-31' }]
                : [{ productId: 32, productName: 'Gasket', sku: 'G-32' }]
        );
    });

    it('loads active mapped products and clears selection when supplier changes', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={['/purchase-orders?action=add']}>
                <PurchaseOrdersPage />
            </MemoryRouter>
        );

        const supplierSelect = await screen.findByLabelText('Supplier *');
        const productSelect = screen.getByLabelText('Product *');
        await user.selectOptions(supplierSelect, '10');
        await waitFor(() => {
            expect(mocks.getActiveProducts).toHaveBeenCalledWith(10);
            expect(screen.getByRole('option', {
                name: 'Widget (W-31)',
            })).toBeInTheDocument();
        });
        await user.selectOptions(productSelect, '31');
        expect(productSelect).toHaveValue('31');

        await user.selectOptions(supplierSelect, '20');

        expect(productSelect).toHaveValue('0');
        await waitFor(() => {
            expect(mocks.getActiveProducts).toHaveBeenCalledWith(20);
            expect(screen.getByRole('option', {
                name: 'Gasket (G-32)',
            })).toBeInTheDocument();
        });
        expect(screen.queryByRole('option', {
            name: 'Widget (W-31)',
        })).not.toBeInTheDocument();
    });
});
