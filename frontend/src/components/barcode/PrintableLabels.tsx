import { ProductBarcode } from './ProductBarcode';
import type { Product } from '../../lib/product-api';

export type LabelSize = 'small' | 'medium' | 'large';

export interface LabelSizeOption {
  value: LabelSize;
  label: string;
  dimensions: string;
  widthMm: number;
  heightMm: number;
  barcodeHeight: number;
  barcodeWidth: number;
  columns: number;
}

export const LABEL_SIZE_OPTIONS: LabelSizeOption[] = [
  {
    value: 'small',
    label: 'Small',
    dimensions: '50mm x 25mm',
    widthMm: 50,
    heightMm: 25,
    barcodeHeight: 34,
    barcodeWidth: 1,
    columns: 3,
  },
  {
    value: 'medium',
    label: 'Medium',
    dimensions: '70mm x 35mm',
    widthMm: 70,
    heightMm: 35,
    barcodeHeight: 48,
    barcodeWidth: 1.25,
    columns: 2,
  },
  {
    value: 'large',
    label: 'Large',
    dimensions: '100mm x 50mm',
    widthMm: 100,
    heightMm: 50,
    barcodeHeight: 66,
    barcodeWidth: 1.55,
    columns: 1,
  },
];

export interface PrintableLabelsProps {
  products: Product[];
  labelSize: LabelSize;
  preview?: boolean;
}

export function getLabelSizeOption(labelSize: LabelSize) {
  return LABEL_SIZE_OPTIONS.find((option) => option.value === labelSize) ?? LABEL_SIZE_OPTIONS[1];
}

export function PrintableLabels({ products, labelSize, preview = false }: PrintableLabelsProps) {
  const option = getLabelSizeOption(labelSize);

  return (
    <div
      className="print-label-container"
      style={{
        ['--label-width' as string]: `${option.widthMm}mm`,
        ['--label-height' as string]: `${option.heightMm}mm`,
        ['--label-columns' as string]: String(option.columns),
      }}
    >
      <div className={preview ? 'print-label-sheet print-label-sheet-preview' : 'print-label-sheet'}>
        {products.map((product) => (
          <article key={product.id} className="print-label">
            <div className="print-label-content">
              <h3 className="print-label-name">{product.product_name}</h3>
              <ProductBarcode
                value={product.sku}
                className="print-label-barcode"
                height={option.barcodeHeight}
                width={option.barcodeWidth}
                fontSize={labelSize === 'small' ? 10 : 12}
              />
              <p className="print-label-sku">{product.sku}</p>
              <div className="print-label-meta">
                <span>{product.warehouse_location || 'Warehouse unassigned'}</span>
                <span>Qty {product.quantity.toLocaleString()}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
