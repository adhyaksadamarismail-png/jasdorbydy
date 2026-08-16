import db from '@/lib/db';
import { Product } from '@/types';

/**
 * Service to fetch menu products.
 * Currently reads from SQLite database (with initial dummy data).
 * Easily replaceable with Kopi Kenangan API integration when ready!
 */
export async function getProducts(brandSlug: string): Promise<Product[]> {
  try {
    const brand = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: string } | undefined;
    if (!brand) return [];

    const products = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brand.id) as Product[];
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductDetail(productId: string): Promise<Product | null> {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Product | undefined;
    return product || null;
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return null;
  }
}
