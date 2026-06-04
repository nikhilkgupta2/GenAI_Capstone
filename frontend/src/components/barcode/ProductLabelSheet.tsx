import { PrintableLabels, type LabelSize } from './PrintableLabels';
import type { Product } from '../../lib/product-api';

type ProductLabelSheetProps = {
  products: Product[];
  labelSize?: LabelSize;
};

export function productQrPayload(product: Product) {
  return JSON.stringify({
    type: 'ims-product',
    id: product.id,
    sku: product.sku,
    name: product.product_name,
  });
}

export function ProductLabelSheet({ products, labelSize = 'medium' }: ProductLabelSheetProps) {
  return <PrintableLabels products={products} labelSize={labelSize} preview />;
}
