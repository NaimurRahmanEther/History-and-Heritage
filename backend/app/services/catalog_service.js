const { query } = require("../db");
const {
  mapProductRow,
  mapCategoryRow,
  mapDistrictRow,
  mapArtisanRow,
} = require("../utils/serializers");

const PRODUCT_BASE_SELECT = `
  SELECT
    p.id,
    p.name,
    p.price,
    p.original_price,
    p.image,
    p.rating,
    p.review_count,
    p.description,
    p.craft_process,
    p.cultural_significance,
    p.artisan_id,
    p.in_stock,
    p.created_at,
    c.id AS category_id,
    c.name AS category_name,
    d.id AS district_id,
    d.name AS district_name,
    COALESCE(
      (
        SELECT json_agg(pi.image_url ORDER BY pi.sort_order ASC)
        FROM product_images pi
        WHERE pi.product_id = p.id
      ),
      '[]'::json
    ) AS images
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id
  INNER JOIN districts d ON d.id = p.district_id
  LEFT JOIN artisans a ON a.id = p.artisan_id
`;

function buildProductWhereClause(filters) {
  const clauses = ["c.active = TRUE", "d.active = TRUE"];
  const values = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    clauses.push(
      `(LOWER(p.name) LIKE LOWER($${index}) OR LOWER(p.description) LIKE LOWER($${index}) OR LOWER(c.name) LIKE LOWER($${index}) OR LOWER(d.name) LIKE LOWER($${index}))`
    );
  }

  if (filters.categoryId) {
    values.push(filters.categoryId);
    clauses.push(`p.category_id = $${values.length}`);
  }

  if (filters.districtId) {
    values.push(filters.districtId);
    clauses.push(`p.district_id = $${values.length}`);
  }

  if (filters.artisanId) {
    values.push(filters.artisanId);
    clauses.push(`p.artisan_id = $${values.length}`);
  }

  if (filters.onlyInStock) {
    clauses.push("p.in_stock = TRUE");
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

async function getCatalogProducts(filters = {}) {
  const { whereSql, values } = buildProductWhereClause({
    search: filters.search ? String(filters.search).trim() : "",
    categoryId: filters.categoryId ? String(filters.categoryId) : "",
    districtId: filters.districtId ? String(filters.districtId) : "",
    artisanId: filters.artisanId ? String(filters.artisanId) : "",
    onlyInStock: Boolean(filters.onlyInStock),
  });

  const result = await query(
    `${PRODUCT_BASE_SELECT}
     ${whereSql}
     ORDER BY p.created_at DESC`,
    values
  );

  return result.rows.map(mapProductRow);
}

async function getCatalogProductById(id) {
  const result = await query(
    `${PRODUCT_BASE_SELECT}
     WHERE p.id = $1 AND c.active = TRUE AND d.active = TRUE
     LIMIT 1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapProductRow(result.rows[0]);
}

async function getCategories(includeInactive = false) {
  const result = await query(
    `SELECT
       c.id,
       c.name,
       c.image,
       c.description,
       c.active,
       c.created_at,
       COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`
  );

  const mapped = result.rows.map(mapCategoryRow);
  return includeInactive ? mapped : mapped.filter((item) => item.active);
}

async function getCategoryById(id) {
  const result = await query(
    `SELECT
       c.id,
       c.name,
       c.image,
       c.description,
       c.active,
       c.created_at,
       COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapCategoryRow(result.rows[0]);
}

async function getDistricts(includeInactive = false) {
  const result = await query(
    `SELECT
       d.id,
       d.name,
       d.division,
       d.image,
       d.description,
       d.active,
       d.created_at,
       COUNT(p.id)::int AS product_count
     FROM districts d
     LEFT JOIN products p ON p.district_id = d.id
     GROUP BY d.id
     ORDER BY d.name ASC`
  );

  const mapped = result.rows.map(mapDistrictRow);
  return includeInactive ? mapped : mapped.filter((item) => item.active);
}

async function getDistrictById(id) {
  const result = await query(
    `SELECT
       d.id,
       d.name,
       d.division,
       d.image,
       d.description,
       d.active,
       d.created_at,
       COUNT(p.id)::int AS product_count
     FROM districts d
     LEFT JOIN products p ON p.district_id = d.id
     WHERE d.id = $1
     GROUP BY d.id`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapDistrictRow(result.rows[0]);
}

async function getArtisans(includeInactive = false) {
  const result = await query(
    `SELECT
       a.id,
       a.name,
       a.image,
       a.district_id,
       d.name AS district_name,
       a.specialty,
       a.bio,
       a.story,
       a.years_of_experience,
       a.active,
       a.created_at,
       COUNT(p.id)::int AS product_count
     FROM artisans a
     INNER JOIN districts d ON d.id = a.district_id
     LEFT JOIN products p ON p.artisan_id = a.id
     GROUP BY a.id, d.name
     ORDER BY a.created_at DESC`
  );

  const mapped = result.rows.map(mapArtisanRow);
  return includeInactive ? mapped : mapped.filter((item) => item.active);
}

async function getArtisanById(id) {
  const result = await query(
    `SELECT
       a.id,
       a.name,
       a.image,
       a.district_id,
       d.name AS district_name,
       a.specialty,
       a.bio,
       a.story,
       a.years_of_experience,
       a.active,
       a.created_at,
       COUNT(p.id)::int AS product_count
     FROM artisans a
     INNER JOIN districts d ON d.id = a.district_id
     LEFT JOIN products p ON p.artisan_id = a.id
     WHERE a.id = $1
     GROUP BY a.id, d.name`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapArtisanRow(result.rows[0]);
}

module.exports = {
  getCatalogProducts,
  getCatalogProductById,
  getCategories,
  getCategoryById,
  getDistricts,
  getDistrictById,
  getArtisans,
  getArtisanById,
};

