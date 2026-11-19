import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { PackagePlus, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { supplierApi } from '../api/supplierApi';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, TableSkeleton } from '../components/ui/Spinner';
import { TableWrap, Td, Th } from '../components/Table';
import { useToast } from '../context/useToast';
import type {
    Product,
    Supplier,
    SupplierProductAdminMapping,
} from '../types';
import { getApiErrorMessage } from '../utils/apiError';
import { money } from '../utils/format';

type MappingDetails = {
    purchasePrice: string;
    leadTimeDays: string;
    supplierProductCode: string;
};

const EMPTY_DETAILS: MappingDetails = {
    purchasePrice: '',
    leadTimeDays: '',
    supplierProductCode: '',
};

export default function SupplierProductMappingsPage() {
    const [searchParams] = useSearchParams();
    const { error: showError, success: showSuccess } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
    const [products, setProducts] = useState<Product[] | null>(null);
    const [mappings, setMappings] =
        useState<SupplierProductAdminMapping[] | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState(
        () => Number(searchParams.get('supplierId')) || 0
    );
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [details, setDetails] = useState<Record<number, MappingDetails>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingMappingId, setUpdatingMappingId] = useState<number | null>(
        null
    );
    const [loadError, setLoadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [supplierList, productList, mappingList] = await Promise.all([
                supplierApi.getAll(),
                productApi.getAll(),
                supplierApi.getAllMappings(),
            ]);
            setSuppliers(supplierList);
            setProducts(productList);
            setMappings(mappingList);
        } catch (reason) {
            const message = getApiErrorMessage(
                reason, 'Could not load supplier-product mappings'
            );
            setLoadError(message);
            showError(message);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const selectedSupplier = suppliers?.find(
        supplier => supplier.id === selectedSupplierId
    );
    const existingProductIds = useMemo(
        () => new Set(
            mappings?.filter(
                mapping => mapping.supplierId === selectedSupplierId
            ).map(mapping => mapping.productId) ?? []
        ),
        [mappings, selectedSupplierId]
    );
    const availableProducts = products?.filter(
        product => !existingProductIds.has(product.id)
    ) ?? [];

    const toggleProduct = (productId: number) => {
        setSelectedProductIds(current => current.includes(productId)
            ? current.filter(id => id !== productId)
            : [...current, productId]);
        setFormError(null);
    };

    const updateDetails = (
        productId: number,
        field: keyof MappingDetails,
        value: string
    ) => {
        setDetails(current => ({
            ...current,
            [productId]: {
                ...EMPTY_DETAILS,
                ...current[productId],
                [field]: value,
            },
        }));
    };

    const createMappings = async (event: FormEvent) => {
        event.preventDefault();
        setFormError(null);
        if (!selectedSupplierId || selectedProductIds.length === 0) {
            setFormError('Select a supplier and at least one product.');
            return;
        }

        const requests: Array<{
            productId: number;
            purchasePrice: number | null;
            leadTimeDays: number | null;
            supplierProductCode: string | null;
        }> = [];
        for (const productId of selectedProductIds) {
            const productDetails = details[productId] ?? EMPTY_DETAILS;
            const price = productDetails.purchasePrice === ''
                ? null
                : Number(productDetails.purchasePrice);
            const leadTime = productDetails.leadTimeDays === ''
                ? null
                : Number(productDetails.leadTimeDays);
            if (price !== null && (!Number.isFinite(price) || price < 0)) {
                setFormError('Purchase price must be zero or greater.');
                return;
            }
            if (leadTime !== null
                    && (!Number.isInteger(leadTime) || leadTime < 0)) {
                setFormError('Lead time must be a whole number zero or greater.');
                return;
            }
            requests.push({
                productId,
                purchasePrice: price,
                leadTimeDays: leadTime,
                supplierProductCode:
                    productDetails.supplierProductCode.trim() || null,
            });
        }

        setSaving(true);
        const results = await Promise.allSettled(
            requests.map(request => supplierApi.addProduct(
                selectedSupplierId, request
            ))
        );
        const failedProductIds: number[] = [];
        let createdCount = 0;
        let hasError = false;
        let firstError: unknown;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                createdCount += 1;
            } else {
                failedProductIds.push(requests[index].productId);
                hasError = true;
                firstError ??= result.reason;
            }
        });

        if (createdCount > 0) {
            showSuccess(
                `${createdCount} supplier-product mapping${createdCount === 1 ? '' : 's'} created.`
            );
        }
        if (hasError) {
            showError(getApiErrorMessage(
                firstError,
                'Some mappings could not be created. Review and retry.'
            ));
        }

        const successfulIds = new Set(
            selectedProductIds.filter(id => !failedProductIds.includes(id))
        );
        setSelectedProductIds(failedProductIds);
        setDetails(current => Object.fromEntries(
            Object.entries(current).filter(
                ([id]) => !successfulIds.has(Number(id))
            )
        ));
        await load();
        setSaving(false);
    };

    const toggleMapping = async (mapping: SupplierProductAdminMapping) => {
        setUpdatingMappingId(mapping.id);
        try {
            const updated = await supplierApi.setProductActive(
                mapping.supplierId, mapping.productId, !mapping.active
            );
            setMappings(current => current?.map(item =>
                item.id === mapping.id
                    ? { ...item, active: updated.active }
                    : item
            ) ?? null);
            showSuccess(mapping.active
                ? 'Supplier-product mapping deactivated.'
                : 'Supplier-product mapping activated.');
        } catch (reason) {
            showError(getApiErrorMessage(
                reason, 'Could not update the supplier-product mapping.'
            ));
        } finally {
            setUpdatingMappingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Administration"
                title="Supplier Product Mapping"
                description="Connect existing products to the suppliers that genuinely provide them."
            />

            {loadError ? (
                <section className="card p-8 text-center">
                    <p role="alert" className="text-sm text-rose-600">
                        {loadError}
                    </p>
                    <button type="button" className="btn-secondary mt-4"
                        onClick={() => void load()}>
                        Try again
                    </button>
                </section>
            ) : loading ? (
                <TableSkeleton cols={6} rows={5} />
            ) : (
                <>
                    <section className="card p-5 sm:p-6">
                        <form onSubmit={createMappings} className="space-y-5">
                            <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_2fr]">
                                <div>
                                    <label className="label"
                                        htmlFor="mapping-supplier">
                                        Supplier
                                    </label>
                                    <select
                                        id="mapping-supplier"
                                        className="input"
                                        value={selectedSupplierId || ''}
                                        onChange={event => {
                                            setSelectedSupplierId(
                                                Number(event.target.value) || 0
                                            );
                                            setSelectedProductIds([]);
                                            setDetails({});
                                            setFormError(null);
                                        }}
                                        disabled={!suppliers?.length || saving}
                                    >
                                        <option value="">Select a supplier...</option>
                                        {suppliers?.map(supplier => (
                                            <option key={supplier.id}
                                                value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                    {suppliers?.length === 0 && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            Add a supplier before creating a mapping.
                                        </p>
                                    )}
                                </div>

                                <fieldset disabled={!selectedSupplier || saving}>
                                    <legend className="label">
                                        Products to map
                                    </legend>
                                    {!selectedSupplier ? (
                                        <p className="text-sm text-slate-500">
                                            Select a supplier to see available products.
                                        </p>
                                    ) : availableProducts.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No unmapped products are available for this supplier.
                                        </p>
                                    ) : (
                                        <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
                                            {availableProducts.map(product => {
                                                const selected =
                                                    selectedProductIds.includes(product.id);
                                                const productDetails =
                                                    details[product.id] ?? EMPTY_DETAILS;
                                                return (
                                                    <div key={product.id}
                                                        className="space-y-3">
                                                        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                onChange={() =>
                                                                    toggleProduct(product.id)}
                                                            />
                                                            <span>
                                                                {product.name}
                                                                <span className="ml-2 text-xs text-slate-400">
                                                                    {product.sku}
                                                                </span>
                                                            </span>
                                                        </label>
                                                        {selected && (
                                                            <div className="grid gap-3 border-l-2 border-indigo-100 pl-7 sm:grid-cols-3">
                                                                <label className="text-xs font-medium text-slate-600">
                                                                    Purchase price (optional)
                                                                    <input
                                                                        className="input mt-1"
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={productDetails.purchasePrice}
                                                                        onChange={event =>
                                                                            updateDetails(
                                                                                product.id,
                                                                                'purchasePrice',
                                                                                event.target.value
                                                                            )}
                                                                        placeholder="Only if known"
                                                                    />
                                                                </label>
                                                                <label className="text-xs font-medium text-slate-600">
                                                                    Lead time in days (optional)
                                                                    <input
                                                                        className="input mt-1"
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={productDetails.leadTimeDays}
                                                                        onChange={event =>
                                                                            updateDetails(
                                                                                product.id,
                                                                                'leadTimeDays',
                                                                                event.target.value
                                                                            )}
                                                                        placeholder="Only if known"
                                                                    />
                                                                </label>
                                                                <label className="text-xs font-medium text-slate-600">
                                                                    Supplier product code (optional)
                                                                    <input
                                                                        className="input mt-1"
                                                                        type="text"
                                                                        maxLength={100}
                                                                        value={productDetails.supplierProductCode}
                                                                        onChange={event =>
                                                                            updateDetails(
                                                                                product.id,
                                                                                'supplierProductCode',
                                                                                event.target.value
                                                                            )}
                                                                        placeholder="Only if known"
                                                                    />
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </fieldset>
                            </div>

                            {formError && (
                                <p role="alert" className="text-sm text-rose-600">
                                    {formError}
                                </p>
                            )}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">
                                    Leave price and lead time blank when unknown. No supplier-product links are created automatically.
                                </p>
                                <button type="submit" className="btn-primary"
                                    disabled={saving
                                        || !selectedSupplier
                                        || selectedProductIds.length === 0}>
                                    <PackagePlus className="h-4 w-4" />
                                    {saving
                                        ? 'Saving mappings...'
                                        : `Create ${selectedProductIds.length || ''} mapping${selectedProductIds.length === 1 ? '' : 's'}`}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="card overflow-hidden">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                Existing mappings
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {mappings?.length ?? 0} explicit supplier-product relationship{mappings?.length === 1 ? '' : 's'}
                            </p>
                        </div>
                        {!mappings?.length ? (
                            <EmptyState
                                icon={Truck}
                                title="No supplier-product mappings yet"
                                message="Create a mapping only after confirming that the supplier provides the selected product."
                            />
                        ) : (
                            <TableWrap>
                                <thead>
                                    <tr>
                                        <Th>Supplier</Th>
                                        <Th>Product</Th>
                                        <Th>Purchase price</Th>
                                        <Th>Lead time</Th>
                                        <Th>Supplier code</Th>
                                        <Th>Status</Th>
                                        <Th>Action</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mappings.map(mapping => (
                                        <tr key={mapping.id}>
                                            <Td className="font-medium text-slate-800">
                                                {mapping.supplierName}
                                            </Td>
                                            <Td>
                                                {mapping.productName}
                                                <span className="ml-2 text-xs text-slate-400">
                                                    {mapping.sku}
                                                </span>
                                            </Td>
                                            <Td>
                                                {mapping.purchasePrice === null
                                                    ? '—'
                                                    : money(mapping.purchasePrice)}
                                            </Td>
                                            <Td>
                                                {mapping.leadTimeDays === null
                                                    ? '—'
                                                    : `${mapping.leadTimeDays} days`}
                                            </Td>
                                            <Td>{mapping.supplierProductCode || '—'}</Td>
                                            <Td>
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    mapping.active
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {mapping.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </Td>
                                            <Td>
                                                <button type="button"
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                                    disabled={updatingMappingId !== null}
                                                    onClick={() =>
                                                        void toggleMapping(mapping)}>
                                                    {updatingMappingId === mapping.id
                                                        ? 'Saving...'
                                                        : mapping.active
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </button>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </TableWrap>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
