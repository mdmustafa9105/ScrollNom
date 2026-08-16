import { dbAll, dbGet, dbRun } from '../db/database.js';

// GET /api/restaurants - Fetch list of restaurants
export const handleGetRestaurants = async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM restaurants';
    const params = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR cuisine LIKE ? OR address LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY rating DESC';

    const rows = await dbAll(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/restaurants/:id/menu - Fetch canonical menu for a restaurant
export const handleGetRestaurantMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { search, dietType, category } = req.query;

    const restaurant = await dbGet('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Restaurant ${id} not found.` }
      });
    }

    let sql = 'SELECT * FROM restaurant_menu_items WHERE restaurant_id = ?';
    const params = [id];

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (dietType && dietType !== 'ALL') {
      sql += ' AND diet_type = ?';
      params.push(dietType);
    }

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY category ASC, name ASC';

    const items = await dbAll(sql, params);

    res.json({
      success: true,
      data: {
        restaurant,
        menu: items
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/restaurants/:id/menu - Add or edit menu item
export const handleAddOrUpdateMenuItem = async (req, res, next) => {
  try {
    const { id: restaurantId } = req.params;
    const { itemId, name, description, category, dietType, price, isAvailable, activeOfferId, discountPercent, promoCode, imageUrl } = req.body;

    if (!name || !category || !dietType || price === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MENU_ITEM', message: 'Name, category, dietType, and price are required.' }
      });
    }

    const dishId = itemId || `d_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await dbGet('SELECT * FROM restaurant_menu_items WHERE id = ?', [dishId]);

    if (existing) {
      await dbRun(`
        UPDATE restaurant_menu_items
        SET name = ?, description = ?, category = ?, diet_type = ?, price = ?, is_available = ?, active_offer_id = ?, discount_percent = ?, promo_code = ?, image_url = ?
        WHERE id = ?
      `, [name, description || '', category, dietType, price, isAvailable !== false ? 1 : 0, activeOfferId || null, discountPercent || 0, promoCode || null, imageUrl || '', dishId]);
    } else {
      await dbRun(`
        INSERT INTO restaurant_menu_items (id, restaurant_id, name, description, category, diet_type, price, is_available, active_offer_id, discount_percent, promo_code, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [dishId, restaurantId, name, description || '', category, dietType, price, isAvailable !== false ? 1 : 0, activeOfferId || null, discountPercent || 0, promoCode || null, imageUrl || '']);
    }

    const item = await dbGet('SELECT * FROM restaurant_menu_items WHERE id = ?', [dishId]);

    res.status(existing ? 200 : 201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};
