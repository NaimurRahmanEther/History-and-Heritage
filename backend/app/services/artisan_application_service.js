const { getClient, query } = require("../db");

const APPLICATION_STATUSES = new Set(["pending", "approved", "rejected"]);

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapApplicationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || row.full_name,
    userEmail: row.user_email || row.email,
    userPhone: row.user_phone || row.phone || "",
    artisanId: row.artisan_id || "",
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    districtId: row.district_id,
    districtName: row.district_name || "",
    specialty: row.specialty,
    yearsOfExperience: Number(row.years_of_experience || 0),
    bio: row.bio || "",
    story: row.story || "",
    sampleWorkUrl: row.sample_work_url || "",
    status: row.status,
    rejectionReason: row.rejection_reason || "",
    reviewedBy: row.reviewed_by || "",
    reviewedByName: row.reviewed_by_name || "",
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

async function getApplicationByUserId(userId) {
  const result = await query(
    `SELECT
       aa.*,
       u.name AS user_name,
       u.email AS user_email,
       u.phone AS user_phone,
       d.name AS district_name,
       reviewer.name AS reviewed_by_name,
       a.id AS artisan_id
     FROM artisan_applications aa
     INNER JOIN users u ON u.id = aa.user_id
     INNER JOIN districts d ON d.id = aa.district_id
     LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
     LEFT JOIN artisans a ON a.user_id = aa.user_id
     WHERE aa.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) return null;
  return mapApplicationRow(result.rows[0]);
}

async function submitArtisanApplication(user, payload = {}) {
  if (!user || !user.id) {
    const error = new Error("User authentication is required.");
    error.statusCode = 401;
    throw error;
  }

  if (user.role === "admin") {
    const error = new Error("Admin accounts cannot submit artisan applications.");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "artisan") {
    const error = new Error("You are already an approved artisan.");
    error.statusCode = 400;
    throw error;
  }

  const fullName = String(payload.fullName || user.name || "").trim();
  const email = String(payload.email || user.email || "")
    .trim()
    .toLowerCase();
  const phone = String(payload.phone || user.phone || "").trim();
  const districtId = String(payload.districtId || "").trim();
  const specialty = String(payload.specialty || "").trim();
  const yearsOfExperience = Math.max(0, Math.floor(Number(payload.yearsOfExperience || 0)));
  const bio = String(payload.bio || "").trim();
  const story = String(payload.story || bio || "").trim();
  const sampleWorkUrl = String(payload.sampleWorkUrl || "").trim();

  if (!fullName || !email || !phone || !districtId || !specialty || !bio) {
    const error = new Error(
      "Full name, email, phone, district, specialty, and bio are required."
    );
    error.statusCode = 400;
    throw error;
  }

  const districtResult = await query(
    `SELECT id FROM districts WHERE id = $1 AND active = TRUE LIMIT 1`,
    [districtId]
  );
  if (districtResult.rowCount === 0) {
    const error = new Error("Selected district is not available.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await query(
    `SELECT id, status
     FROM artisan_applications
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  if (existing.rowCount === 0) {
    await query(
      `INSERT INTO artisan_applications (
         user_id,
         full_name,
         email,
         phone,
         district_id,
         specialty,
         years_of_experience,
         bio,
         story,
         sample_work_url,
         status,
         rejection_reason,
         reviewed_by,
         reviewed_at,
         updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, ''), 'pending', NULL, NULL, NULL, NOW()
       )`,
      [
        user.id,
        fullName,
        email,
        phone,
        districtId,
        specialty,
        yearsOfExperience,
        bio,
        story,
        sampleWorkUrl,
      ]
    );
  } else {
    const status = existing.rows[0].status;
    if (status === "pending") {
      const error = new Error("Your artisan application is already pending review.");
      error.statusCode = 409;
      throw error;
    }
    if (status === "approved") {
      const error = new Error("Your artisan application has already been approved.");
      error.statusCode = 409;
      throw error;
    }

    await query(
      `UPDATE artisan_applications
       SET
         full_name = $2,
         email = $3,
         phone = $4,
         district_id = $5,
         specialty = $6,
         years_of_experience = $7,
         bio = $8,
         story = $9,
         sample_work_url = NULLIF($10, ''),
         status = 'pending',
         rejection_reason = NULL,
         reviewed_by = NULL,
         reviewed_at = NULL,
         updated_at = NOW()
       WHERE user_id = $1`,
      [
        user.id,
        fullName,
        email,
        phone,
        districtId,
        specialty,
        yearsOfExperience,
        bio,
        story,
        sampleWorkUrl,
      ]
    );
  }

  return getApplicationByUserId(user.id);
}

async function listArtisanApplications(filters = {}) {
  const statusFilter = String(filters.status || "").trim().toLowerCase();
  const values = [];
  let whereClause = "";

  if (statusFilter && APPLICATION_STATUSES.has(statusFilter)) {
    values.push(statusFilter);
    whereClause = `WHERE aa.status = $${values.length}`;
  }

  const result = await query(
    `SELECT
       aa.*,
       u.name AS user_name,
       u.email AS user_email,
       u.phone AS user_phone,
       d.name AS district_name,
       reviewer.name AS reviewed_by_name,
       a.id AS artisan_id
     FROM artisan_applications aa
     INNER JOIN users u ON u.id = aa.user_id
     INNER JOIN districts d ON d.id = aa.district_id
     LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
     LEFT JOIN artisans a ON a.user_id = aa.user_id
     ${whereClause}
     ORDER BY
       CASE aa.status
         WHEN 'pending' THEN 0
         WHEN 'rejected' THEN 1
         ELSE 2
       END,
       aa.updated_at DESC`,
    values
  );

  return result.rows.map(mapApplicationRow);
}

async function approveArtisanApplication(applicationId, adminUserId) {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT aa.*, u.name AS user_name
       FROM artisan_applications aa
       INNER JOIN users u ON u.id = aa.user_id
       WHERE aa.id = $1
       LIMIT 1`,
      [applicationId]
    );

    if (applicationResult.rowCount === 0) {
      const error = new Error("Artisan application not found.");
      error.statusCode = 404;
      throw error;
    }

    const application = applicationResult.rows[0];
    if (application.status === "approved") {
      const error = new Error("This application is already approved.");
      error.statusCode = 409;
      throw error;
    }

    const baseSlug = slugify(application.full_name || application.user_name || "artisan");
    const generatedArtisanId = `artisan-${baseSlug || "profile"}-${Date.now()}`;

    const artisanResult = await client.query(
      `SELECT id
       FROM artisans
       WHERE user_id = $1
       LIMIT 1`,
      [application.user_id]
    );

    if (artisanResult.rowCount === 0) {
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
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE
         )`,
        [
          generatedArtisanId,
          application.user_id,
          application.full_name,
          "",
          application.district_id,
          application.specialty,
          application.bio,
          application.story,
          Number(application.years_of_experience || 0),
        ]
      );
    } else {
      await client.query(
        `UPDATE artisans
         SET
           name = $2,
           district_id = $3,
           specialty = $4,
           bio = $5,
           story = $6,
           years_of_experience = $7,
           active = TRUE
         WHERE user_id = $1`,
        [
          application.user_id,
          application.full_name,
          application.district_id,
          application.specialty,
          application.bio,
          application.story,
          Number(application.years_of_experience || 0),
        ]
      );
    }

    await client.query(
      `UPDATE users
       SET role = 'artisan', updated_at = NOW()
       WHERE id = $1`,
      [application.user_id]
    );

    await client.query(
      `UPDATE artisan_applications
       SET
         status = 'approved',
         rejection_reason = NULL,
         reviewed_by = $2,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1`,
      [applicationId, adminUserId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const refreshed = await query(
    `SELECT
       aa.*,
       u.name AS user_name,
       u.email AS user_email,
       u.phone AS user_phone,
       d.name AS district_name,
       reviewer.name AS reviewed_by_name,
       a.id AS artisan_id
     FROM artisan_applications aa
     INNER JOIN users u ON u.id = aa.user_id
     INNER JOIN districts d ON d.id = aa.district_id
     LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
     LEFT JOIN artisans a ON a.user_id = aa.user_id
     WHERE aa.id = $1
     LIMIT 1`,
    [applicationId]
  );

  return mapApplicationRow(refreshed.rows[0]);
}

async function rejectArtisanApplication(applicationId, adminUserId, reason) {
  const rejectionReason = String(reason || "").trim();
  if (!rejectionReason) {
    const error = new Error("Rejection reason is required.");
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `UPDATE artisan_applications
     SET
       status = 'rejected',
       rejection_reason = $3,
       reviewed_by = $2,
       reviewed_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [applicationId, adminUserId, rejectionReason]
  );

  if (result.rowCount === 0) {
    const error = new Error("Artisan application not found.");
    error.statusCode = 404;
    throw error;
  }

  const refreshed = await query(
    `SELECT
       aa.*,
       u.name AS user_name,
       u.email AS user_email,
       u.phone AS user_phone,
       d.name AS district_name,
       reviewer.name AS reviewed_by_name,
       a.id AS artisan_id
     FROM artisan_applications aa
     INNER JOIN users u ON u.id = aa.user_id
     INNER JOIN districts d ON d.id = aa.district_id
     LEFT JOIN users reviewer ON reviewer.id = aa.reviewed_by
     LEFT JOIN artisans a ON a.user_id = aa.user_id
     WHERE aa.id = $1
     LIMIT 1`,
    [applicationId]
  );

  return mapApplicationRow(refreshed.rows[0]);
}

module.exports = {
  APPLICATION_STATUSES,
  getApplicationByUserId,
  submitArtisanApplication,
  listArtisanApplications,
  approveArtisanApplication,
  rejectArtisanApplication,
};
