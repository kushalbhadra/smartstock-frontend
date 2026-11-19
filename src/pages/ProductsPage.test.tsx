import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductsPage from './ProductsPage';

const mocks = vi.hoisted(() => ({
    getProducts: vi.fn(),
    deleteProduct: vi.fn(),
    getStocks: vi.fn(),
    getWarehouses: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
}));

vi.mock('../api/productApi', () => ({
    productApi: {
        getAll: mocks.getProducts,
        delete: mocks.deleteProduct,
    },
}));
vi.mock('../api/stockApi', () => ({
    stockApi: { getAll: mocks.getStocks },
}));
vi.mock('../api/warehouseApi', () => ({
    warehouseApi: { getAll: mocks.getWarehouses },
}));
vi.mock('../context/useAuth', () => ({
    useAuth: () => ({ isAdmin: true }),
}));
vi.mock('../context/useToast', () => ({
    useToast: () => ({
        error: mocks.showError,
        success: mocks.showSuccess,
    }),
}));

const product = {
    id: 42,
    name: 'Widget',
    sku: 'W-42',
    category: 'Other',
    unit: 'piece',
    price: 10,
    storageCapacityFactor: 1,
    canDelete: true,
    deletionBlockedReason: null,
};

function renderPage() {
    return render(
        <MemoryRouter>
            <ProductsPage />
        </MemoryRouter>
    );
}

describe('ProductsPage deletion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getProducts.mockResolvedValue([product]);
        mocks.deleteProduct.mockResolvedValue({ success: true });
        mocks.getStocks.mockResolvedValue([]);
        mocks.getWarehouses.mockResolvedValue([]);
    });

    it('confirms with the product name, deletes, notifies, and reloads', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('button', {
            name: 'Delete Widget',
        }));
        expect(screen.getByText(
            'Are you sure you want to delete "Widget"? This cannot be undone.'
        )).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: /^Delete$/,
        }));

        await waitFor(() => {
            expect(mocks.deleteProduct).toHaveBeenCalledWith(42);
            expect(mocks.getProducts).toHaveBeenCalledTimes(2);
        });
        expect(mocks.showSuccess).toHaveBeenCalledWith('Product deleted');
    });

    it('hides deletion and all deletion details when the product is blocked', async () => {
        const reason = 'Cannot delete product because it has stock records.';
        mocks.getProducts.mockResolvedValue([{
            ...product,
            canDelete: false,
            deletionBlockedReason: reason,
        }]);
        renderPage();

        await screen.findByText('Widget');
        expect(screen.queryByRole('button', {
            name: 'Delete Widget',
        })).not.toBeInTheDocument();
        expect(screen.queryByText(reason)).not.toBeInTheDocument();
    });

    it('shows a failed delete reason only through the error toast', async () => {
        const user = userEvent.setup();
        const reason = 'Cannot delete product because it has stock records.';
        mocks.deleteProduct.mockRejectedValueOnce({
            isAxiosError: true,
            response: { data: { message: reason } },
        });
        renderPage();

        await user.click(await screen.findByRole('button', {
            name: 'Delete Widget',
        }));
        await user.click(screen.getByRole('button', {
            name: /^Delete$/,
        }));

        await waitFor(() => {
            expect(mocks.showError).toHaveBeenCalledWith(reason);
        });
        expect(screen.queryByText(reason)).not.toBeInTheDocument();
    });
});
