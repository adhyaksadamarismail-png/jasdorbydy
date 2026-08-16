import db from '@/lib/db';
import { Outlet } from '@/types';

/**
 * Service to fetch outlets.
 * Currently reads from SQLite database (with initial dummy data).
 * Easily replaceable with Kopi Kenangan API integration when ready!
 */
export async function getOutlets(brandSlug: string): Promise<Outlet[]> {
  try {
    const brand = db.prepare('SELECT id FROM brands WHERE slug = ?').get(brandSlug) as { id: string } | undefined;
    if (!brand) return [];

    const outlets = db.prepare('SELECT * FROM outlets WHERE brand_id = ?').all(brand.id) as Outlet[];
    return outlets;
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return [];
  }
}

export async function getOutletDetail(outletId: string): Promise<Outlet | null> {
  try {
    const outlet = db.prepare('SELECT * FROM outlets WHERE id = ?').get(outletId) as Outlet | undefined;
    return outlet || null;
  } catch (error) {
    console.error('Error fetching outlet detail:', error);
    return null;
  }
}
