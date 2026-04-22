const bcrypt = require("bcryptjs");
const { getClient } = require("../db");

const DISTRICTS = [
  {
    id: "rangpur",
    name: "Rangpur",
    division: "Rangpur",
    image: "https://images.unsplash.com/photo-1590579491624-f98f36d4c763?w=600&q=80",
    description: "Famous for Shataranji weaving and traditional textiles.",
  },
  {
    id: "jamalpur",
    name: "Jamalpur",
    division: "Mymensingh",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    description: "Known for Nakshi Kantha and embroidery work.",
  },
  {
    id: "tangail",
    name: "Tangail",
    division: "Dhaka",
    image: "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
    description: "Home of the famous Tangail Saree.",
  },
  {
    id: "rajshahi",
    name: "Rajshahi",
    division: "Rajshahi",
    image: "/images/districts/rajshahi.jpg",
    description: "Renowned for silk products and pottery.",
  },
  {
    id: "chapainawabganj",
    name: "Chapainawabganj",
    division: "Rajshahi",
    image: "/images/districts/chapai.webp",
    description: "Famous for mango wood crafts and traditional art.",
  },
  {
    id: "sylhet",
    name: "Sylhet",
    division: "Sylhet",
    image: "/images/districts/sylhet.jpg",
    description: "Known for cane and bamboo crafts.",
  },
  {
    id: "coxs-bazar",
    name: "Cox's Bazar",
    division: "Chattogram",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    description: "Famous for seashell crafts and coastal art.",
  },
  {
    id: "khulna",
    name: "Khulna",
    division: "Khulna",
    image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&q=80",
    description: "Known for Sundarbans-inspired crafts.",
  },
  {
    id: "dhaka",
    name: "Dhaka",
    division: "Dhaka",
    image: "/images/districts/dhaka.jpg",
    description: "Home of legendary Jamdani weaving.",
  },
  {
    id: "comilla",
    name: "Comilla",
    division: "Chattogram",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80",
    description: "Famous for Khadi and traditional textiles.",
  },
  {
    id: "mymensingh",
    name: "Mymensingh",
    division: "Mymensingh",
    image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&q=80",
    description: "Known for folk art and pottery.",
  },
  {
    id: "bogra",
    name: "Bogra",
    division: "Rajshahi",
    image: "https://images.unsplash.com/photo-1590579491624-f98f36d4c763?w=600&q=80",
    description: "Famous for terracotta and clay crafts.",
  },
  {
    id: "kushtia",
    name: "Kushtia",
    division: "Khulna",
    image: "https://images.unsplash.com/photo-1583422528567-5658d8b10c20?w=600&q=80",
    description: "Known for clay pottery and folk culture.",
  },
];

const CATEGORIES = [
  {
    id: "jamdani",
    name: "Jamdani",
    image: "/images/products/jamdani-saree.jpg",
    description: "Exquisite hand-woven muslin fabric with intricate patterns.",
  },
  {
    id: "nakshi-kantha",
    name: "Nakshi Kantha",
    image: "/images/products/nakshi-kantha.jpg",
    description: "Traditional embroidered quilts telling stories through thread.",
  },
  {
    id: "bamboo-crafts",
    name: "Bamboo Crafts",
    image: "/images/products/bamboo-basket.jpg",
    description: "Sustainable handcrafted items from natural bamboo.",
  },
  {
    id: "clay-pottery",
    name: "Clay Pottery",
    image: "/images/products/terracotta-pottery.jpg",
    description: "Traditional terracotta and ceramic artistry.",
  },
  {
    id: "cane-furniture",
    name: "Cane Furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    description: "Elegant and durable handwoven cane pieces.",
  },
  {
    id: "handwoven-textiles",
    name: "Handwoven Textiles",
    image: "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
    description: "Beautiful fabrics crafted on traditional looms.",
  },
];

const ARTISANS = [
  {
    id: "artisan-001",
    name: "Fatima Begum",
    image: "/images/artisans/fatima-begum.jpg",
    districtId: "dhaka",
    specialty: "Jamdani Weaving",
    bio: "Master weaver with 30 years of experience in traditional Jamdani craft.",
    story:
      "Fatima learned the art of Jamdani weaving from her grandmother and now leads a cooperative of women artisans.",
    yearsOfExperience: 30,
  },
  {
    id: "artisan-002",
    name: "Rashida Khatun",
    image: "/images/artisans/rashida-khatun.jpg",
    districtId: "jamalpur",
    specialty: "Nakshi Kantha Embroidery",
    bio: "Award-winning Nakshi Kantha artist keeping alive the storytelling tradition.",
    story:
      "Rashida was born into a family of Kantha makers and now mentors young women in her village.",
    yearsOfExperience: 25,
  },
  {
    id: "artisan-003",
    name: "Abdul Karim",
    image: "/images/artisans/bamboo.webp",
    districtId: "sylhet",
    specialty: "Bamboo and Cane Crafts",
    bio: "Third-generation bamboo craftsman creating sustainable art.",
    story:
      "Abdul blends traditional bamboo techniques with modern design for functional and artistic pieces.",
    yearsOfExperience: 35,
  },
  {
    id: "artisan-010",
    name: "Sokina Khatun",
    image: "/images/artisans/artisan-kustia-clay.jpg",
    districtId: "kushtia",
    specialty: "Clay Pottery",
    bio: "Contemporary potter honoring ancient Bengali clay traditions.",
    story:
      "Sokina established a studio that celebrates Bengali terracotta heritage while exploring new forms.",
    yearsOfExperience: 18,
  },
  {
    id: "artisan-005",
    name: "Mohammad Hasan",
    image: "/images/artisans/silk.webp",
    districtId: "rajshahi",
    specialty: "Silk Weaving",
    bio: "Master silk weaver preserving Rajshahi's textile heritage.",
    story:
      "Mohammad carries forward a family weaving tradition spanning generations in Rajshahi.",
    yearsOfExperience: 40,
  },
  {
    id: "artisan-006",
    name: "Razzak Ali",
    image: "/images/artisans/artisan-tangail-saree.jpg",
    districtId: "tangail",
    specialty: "Tangail Saree Weaving",
    bio: "Expert weaver specializing in traditional Tangail sarees.",
    story:
      "Razzak represents Tangail's iconic handloom saree tradition and trains upcoming artisans.",
    yearsOfExperience: 22,
  },
  {
    id: "artisan-007",
    name: "Amina Khatun",
    image: "/images/artisans/shataronji.jpg",
    districtId: "rangpur",
    specialty: "Nakshi Kantha and Shataranji",
    bio: "Versatile textile artist working in multiple traditional mediums.",
    story:
      "Amina leads a women's cooperative and creates unique textile works rooted in northern Bangladesh.",
    yearsOfExperience: 28,
  },
  {
    id: "artisan-011",
    name: "Robiul Islam",
    image: "/images/artisans/artisan-khadi-sylhet.jpg",
    districtId: "sylhet",
    specialty: "Khadi Saree",
    bio: "A dedicated Khadi saree maker.",
    story:
      "Robiul's work celebrates Khadi as both a heritage craft and a symbol of sustainable fashion.",
    yearsOfExperience: 18,
  },
];

const PRODUCTS = [
  {
    id: "jamdani-saree-001",
    name: "Traditional Jamdani Saree - Midnight Blue",
    price: 15000,
    originalPrice: 18000,
    image: "/images/products/jamdani-saree.jpg",
    images: ["/images/products/jamdani-saree.jpg"],
    categoryId: "jamdani",
    districtId: "dhaka",
    artisanId: "artisan-001",
    rating: 4.9,
    reviewCount: 128,
    description:
      "An exquisite hand-woven Jamdani saree featuring intricate geometric patterns.",
    inStock: true,
    craftProcess:
      "The Jamdani weaving technique involves creating patterns by hand during weaving using supplementary weft.",
    culturalSignificance:
      "Jamdani is a UNESCO Intangible Cultural Heritage and a symbol of Bengali weaving excellence.",
  },
  {
    id: "nakshi-kantha-002",
    name: "Floral Nakshi Kantha Bedspread",
    price: 8500,
    originalPrice: 8500,
    image: "/images/products/nakshi-kantha.jpg",
    images: ["/images/products/nakshi-kantha.jpg"],
    categoryId: "nakshi-kantha",
    districtId: "jamalpur",
    artisanId: "artisan-002",
    rating: 4.8,
    reviewCount: 89,
    description:
      "A handmade Nakshi Kantha bedspread featuring traditional floral motifs.",
    inStock: true,
    craftProcess:
      "Nakshi Kantha uses layered fabric stitched with running stitches to create elaborate motifs.",
    culturalSignificance:
      "This folk art tradition preserves stories of rural Bengali life and women-led creativity.",
  },
  {
    id: "bamboo-basket-003",
    name: "Handwoven Bamboo Storage Basket Set",
    price: 2500,
    originalPrice: 3000,
    image: "/images/products/bamboo-basket.jpg",
    images: [
      "/images/products/bamboo-basket.jpg",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80",
    ],
    categoryId: "bamboo-crafts",
    districtId: "sylhet",
    artisanId: "artisan-003",
    rating: 4.7,
    reviewCount: 156,
    description: "A set of three handwoven bamboo baskets for practical and decorative use.",
    inStock: true,
    craftProcess:
      "Bamboo is split, treated, and woven by hand using techniques passed down through generations.",
    culturalSignificance:
      "Bamboo weaving has long been central to daily life and sustainable craft in Bangladesh.",
  },
  {
    id: "terracotta-vase-004",
    name: "Terracotta Decorative Vase",
    price: 1800,
    originalPrice: 1800,
    image: "/images/products/terracotta-pottery.jpg",
    images: [
      "/images/products/terracotta-pottery.jpg",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
    ],
    categoryId: "clay-pottery",
    districtId: "rajshahi",
    artisanId: "artisan-010",
    rating: 4.6,
    reviewCount: 67,
    description:
      "A terracotta vase featuring traditional Bengali motifs and kiln-fired finish.",
    inStock: true,
    craftProcess:
      "Clay is hand-shaped on a wheel, decorated, and fired in a traditional kiln.",
    culturalSignificance:
      "Terracotta pottery has deep roots in Bengali culture and architecture.",
  },
  {
    id: "silk-scarf-005",
    name: "Rajshahi Silk Scarf - Golden Paisley",
    price: 4500,
    originalPrice: 4500,
    image: "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1601662528567-526cd06f6582?w=600&q=80",
    ],
    categoryId: "handwoven-textiles",
    districtId: "rajshahi",
    artisanId: "artisan-005",
    rating: 4.8,
    reviewCount: 92,
    description: "A luxurious Rajshahi silk scarf with elegant golden paisley patterns.",
    inStock: true,
    craftProcess:
      "Silk threads are hand-dyed and woven on traditional looms for rich texture and detail.",
    culturalSignificance:
      "Rajshahi is celebrated as Bangladesh's silk city with centuries of weaving heritage.",
  },
  {
    id: "tangail-saree-006",
    name: "Tangail Cotton Saree - Ruby Red",
    price: 6500,
    originalPrice: 6500,
    image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
    ],
    categoryId: "handwoven-textiles",
    districtId: "tangail",
    artisanId: "artisan-006",
    rating: 4.7,
    reviewCount: 143,
    description:
      "A handwoven Tangail cotton saree in ruby red with classic border designs.",
    inStock: true,
    craftProcess:
      "Tangail sarees use an extra-warp technique that creates distinctive motifs and textures.",
    culturalSignificance:
      "Tangail sarees are central to Bengali festivities, tradition, and identity.",
  },
  {
    id: "cane-chair-007",
    name: "Traditional Cane Peacock Chair",
    price: 12000,
    originalPrice: 14000,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80",
    ],
    categoryId: "cane-furniture",
    districtId: "sylhet",
    artisanId: "artisan-003",
    rating: 4.9,
    reviewCount: 34,
    description:
      "An iconic peacock chair handwoven from natural cane for statement interiors.",
    inStock: true,
    craftProcess:
      "Cane is soaked, bent, and handwoven by artisans using long-established methods.",
    culturalSignificance:
      "Cane furniture reflects sustainable craftsmanship and enduring Bengali design.",
  },
  {
    id: "nakshi-kantha-wall-008",
    name: "Nakshi Kantha Wall Hanging - Village Scene",
    price: 5500,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1616627561839-074385245ff6?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1616627561839-074385245ff6?w=600&q=80",
    ],
    categoryId: "nakshi-kantha",
    districtId: "rangpur",
    artisanId: "artisan-007",
    rating: 4.8,
    reviewCount: 78,
    description:
      "A hand-embroidered wall hanging depicting a traditional Bengali village scene.",
    inStock: true,
    craftProcess:
      "Layered fabrics are stitched into narrative imagery using traditional Kantha patterns.",
    culturalSignificance:
      "Kantha storytelling preserves memory, culture, and regional identity through thread.",
  },
];

async function seedData() {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO settings (
         id,
         store_name,
         store_email,
         store_phone,
         store_address,
         currency_symbol,
         shipping_fee,
         free_shipping_threshold,
         low_stock_threshold,
         maintenance_mode
       )
       VALUES (1, $1, $2, $3, $4, 'BDT', 200, 5000, 5, FALSE)
       ON CONFLICT (id)
       DO UPDATE SET
         store_name = EXCLUDED.store_name,
         store_email = EXCLUDED.store_email,
         store_phone = EXCLUDED.store_phone,
         store_address = EXCLUDED.store_address`,
      [
        "Bangladesh Heritage",
        "admin@heritage.com",
        "+880 1700 000000",
        "Dhaka, Bangladesh",
      ]
    );

    const adminHash = await bcrypt.hash("demo123", 10);
    const customerHash = await bcrypt.hash("demo123", 10);
    const artisanHash = await bcrypt.hash("demo123", 10);

    await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role`,
      ["admin@example.com", adminHash, "Admin User", "+880 1700 000000"]
    );

    await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role`,
      ["user@example.com", customerHash, "Ayesha Rahman", "+880 1800 000000"]
    );

    const artisanUserResult = await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, 'artisan')
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role
       RETURNING id`,
      ["artisan@example.com", artisanHash, "Fatima Begum", "+880 1900 000000"]
    );
    const artisanUserId = artisanUserResult.rows[0].id;

    for (const district of DISTRICTS) {
      await client.query(
        `INSERT INTO districts (id, name, division, image, description, active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (id)
         DO UPDATE SET
           name = EXCLUDED.name,
           division = EXCLUDED.division,
           image = EXCLUDED.image,
           description = EXCLUDED.description`,
        [district.id, district.name, district.division, district.image, district.description]
      );
    }

    for (const category of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, name, image, description, active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (id)
         DO UPDATE SET
           name = EXCLUDED.name,
           image = EXCLUDED.image,
           description = EXCLUDED.description`,
        [category.id, category.name, category.image, category.description]
      );
    }

    for (const artisan of ARTISANS) {
      await client.query(
        `INSERT INTO artisans (
           id,
           user_id,
           name,
           image,
           district_id,
           specialty,
           bio,
           story,
           years_of_experience,
           active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
         ON CONFLICT (id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           name = EXCLUDED.name,
           image = EXCLUDED.image,
           district_id = EXCLUDED.district_id,
           specialty = EXCLUDED.specialty,
           bio = EXCLUDED.bio,
           story = EXCLUDED.story,
           years_of_experience = EXCLUDED.years_of_experience`,
        [
          artisan.id,
          artisan.id === "artisan-001" ? artisanUserId : null,
          artisan.name,
          artisan.image,
          artisan.districtId,
          artisan.specialty,
          artisan.bio,
          artisan.story,
          artisan.yearsOfExperience,
        ]
      );
    }

    for (const product of PRODUCTS) {
      await client.query(
        `INSERT INTO products (
           id,
           name,
           price,
           original_price,
           category_id,
           district_id,
           artisan_id,
           description,
           craft_process,
           cultural_significance,
           image,
           rating,
           review_count,
           in_stock
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
         )
         ON CONFLICT (id)
         DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           original_price = EXCLUDED.original_price,
           category_id = EXCLUDED.category_id,
           district_id = EXCLUDED.district_id,
           artisan_id = EXCLUDED.artisan_id,
           description = EXCLUDED.description,
           craft_process = EXCLUDED.craft_process,
           cultural_significance = EXCLUDED.cultural_significance,
           image = EXCLUDED.image,
           rating = EXCLUDED.rating,
           review_count = EXCLUDED.review_count,
           in_stock = EXCLUDED.in_stock,
           updated_at = NOW()`,
        [
          product.id,
          product.name,
          product.price,
          product.originalPrice,
          product.categoryId,
          product.districtId,
          product.artisanId,
          product.description,
          product.craftProcess,
          product.culturalSignificance,
          product.image,
          product.rating,
          product.reviewCount,
          product.inStock,
        ]
      );

      await client.query(`DELETE FROM product_images WHERE product_id = $1`, [product.id]);
      for (let index = 0; index < product.images.length; index += 1) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, sort_order)
           VALUES ($1, $2, $3)`,
          [product.id, product.images[index], index]
        );
      }
    }

    await client.query(
      `INSERT INTO carts (user_id)
       SELECT id
       FROM users
       ON CONFLICT (user_id) DO NOTHING`
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  seedData,
};
