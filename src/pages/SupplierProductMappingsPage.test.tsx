import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SupplierProductMappingsPage from './SupplierProductMappingsPage';

const mocks = vi.hoisted(() => ({
    getSuppliers: vi.fn(),
    getProducts: vi.fn(),
    getAllMappings: vi.fn(),
    addProduct: vi.fn(),
    setProductActive: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/supplierApi', () => ({
    supplierApi: {
        getAll: mocks.getSuppliers,
        getAllMappings: mocks.getAllMappings,
        addProduct: mocks.addProduct,
        setProductActive: mocks.setProductActive,
    },
}));
vi.mock('../api/productApi', () => ({
    productApi: { getAll: mocks.getProducts },
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));

const supplier = { id: 21, name: 'RuSolution' };
const products = [
    { id: 31, name: 'Widget', sku: 'W-31' },
    { id: 32, name: 'Gasket', sku: 'G-32' },
].map(product => ({
    ...product,
    category: 'Parts',
    unit: 'piece',
    price: 0,
    storageCapacityFactor: 1,
    canDelete: true,
    deletionBlockedReason: null,
}));

function renderPage(path = '/supplier-product-mappings') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <SupplierProductMappingsPage />
        </MemoryRouter>
    );
}

describe('SupplierProductMappingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getSuppliers.mockResolvedValue([supplier]);
        mocks.getProducts.mockResolvedValue(products);
        mocks.getAllMappings.mockResolvedValue([]);
        mocks.addProduct.mockResolvedValue({ active: true });
        mocks.setProductActive.mockResolvedValue({ active: false });
    });

    it('creates multiple explicit mappings with per-product optional details', async () => {
        const user = userEvent.setup();
        renderPage('/supplier-product-mappings?supplierId=21');

        await user.click(await screen.findByLabelText(/Widget/));
        await user.click(screen.getByLabelText(/Gasket/));
        await user.type(
            screen.getAllByLabelText('Purchase price (optional)')[0],
            '17.25'
        );
        await user.type(
            screen.getAllByLabelText('Lead time in days (optional)')[0],
            '4'
        );
        await user.click(screen.getByRole('button', {
            name: 'Create 2 mappings',
        }));

        await waitFor(() => {
            expect(mocks.addProduct).toHaveBeenCalledWith(21, {
                productId: 31,
                purchasePrice: 17.25,
                leadTimeDays: 4,
                supplierProductCode: null,
            });
        });
        expect(mocks.addProduct).toHaveBeenCalledWith(21, {
            productId: 32,
            purchasePrice: null,
            leadTimeDays: null,
            supplierProductCode: null,
        });
        expect(mocks.showSuccess).toHaveBeenCalledWith(
            '2 supplier-product mappings created.'
        );
    });

    it('leaves unknown price and lead time unset when creating a mapping', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.selectOptions(
            await screen.findByLabelText('Supplier'), '21'
        );
        await user.click(screen.getByLabelText(/Widget/));
        await user.click(screen.getByRole('button', {
            name: 'Create 1 mapping',
        }));

        await waitFor(() => {
            expect(mocks.addProduct).toHaveBeenCalledWith(21, {
                productId: 31,
                purchasePrice: null,
                leadTimeDays: null,
                supplierProductCode: null,
            });
        });
    });

    it('shows existing mappings and allows an admin to deactivate them', async () => {
        const user = userEvent.setup();
        mocks.getAllMappings.mockResolvedValue([{
            id: 90,
            supplierId: 21,
            supplierName: 'RuSolution',
            productId: 31,
            productName: 'Widget',
            sku: 'W-31',
            purchasePrice: null,
            leadTimeDays: null,
            supplierProductCode: null,
            active: true,
        }]);
        renderPage();

        expect(await screen.findByText('Widget')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Deactivate' }));

        expect(mocks.setProductActive).toHaveBeenCalledWith(21, 31, false);
        expect(await screen.findByText('Inactive')).toBeInTheDocument();
    });

    it('does not offer an already mapped product as a new mapping', async () => {
        mocks.getAllMappings.mockResolvedValue([{
            id: 90,
            supplierId: 21,
            supplierName: 'RuSolution',
            productId: 31,
            productName: 'Widget',
            sku: 'W-31',
            purchasePrice: null,
            leadTimeDays: null,
            supplierProductCode: null,
            active: false,
        }]);
        renderPage('/supplier-product-mappings?supplierId=21');

        await screen.findByText('Widget');

        expect(screen.queryByLabelText(/Widget/)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/Gasket/)).toBeInTheDocument();
    });

    it('displays API errors and provides a retry action', async () => {
        const user = userEvent.setup();
        mocks.getAllMappings.mockRejectedValueOnce(new Error('offline'));
        renderPage();

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Could not load supplier-product mappings'
        );
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('Supplier Product Mapping'))
            .toBeInTheDocument();
    });
});
