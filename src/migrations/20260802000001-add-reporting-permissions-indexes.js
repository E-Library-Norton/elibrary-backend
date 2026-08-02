'use strict';

const REPORT_PERMISSIONS = [
  ['reports.view', 'View the reports dashboard'],
  ['reports.users.view', 'View user reports'],
  ['reports.books.view', 'View book and catalog reports'],
  ['reports.logins.view', 'View login reports'],
  ['reports.downloads.view', 'View download reports'],
  ['reports.reading.view', 'View reading progress reports'],
  ['reports.reviews.view', 'View review reports'],
  ['reports.feedback.view', 'View feedback reports'],
  ['reports.activities.view', 'View administrative activity reports'],
  ['reports.export.pdf', 'Export reports as PDF'],
  ['reports.export.excel', 'Export reports as Excel'],
];

const INDEXES = [
  ['users', ['created_at'], 'users_created_at_report_idx'],
  ['users', ['is_active'], 'users_is_active_report_idx'],
  ['downloads', ['downloaded_at'], 'downloads_downloaded_at_report_idx'],
  ['reviews', ['created_at'], 'reviews_created_at_report_idx'],
  ['reviews', ['rating'], 'reviews_rating_report_idx'],
  ['reading_progress', ['last_read_at'], 'reading_progress_last_read_at_report_idx'],
  ['feedbacks', ['created_at'], 'feedbacks_created_at_report_idx'],
  ['feedbacks', ['status'], 'feedbacks_status_report_idx'],
  ['activities', ['created_at'], 'activities_created_at_report_idx'],
  ['activities', ['action'], 'activities_action_report_idx'],
];

module.exports = {
  async up(queryInterface) {
    for (const [name, description] of REPORT_PERMISSIONS) {
      await queryInterface.sequelize.query(
        `INSERT INTO permissions (name, description)
         VALUES (:name, :description)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        { replacements: { name, description } },
      );
    }

    await queryInterface.sequelize.query(
      `INSERT INTO roles_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r
       CROSS JOIN permissions p
       WHERE LOWER(r.name) = 'admin'
         AND p.name IN (:permissionNames)
       ON CONFLICT DO NOTHING`,
      { replacements: { permissionNames: REPORT_PERMISSIONS.map(([name]) => name) } },
    );

    for (const [table, fields, name] of INDEXES) {
      const existing = await queryInterface.showIndex(table);
      const hasEquivalentIndex = existing.some((index) =>
        index.fields?.map((field) => field.attribute || field.name).join(',') === fields.join(',')
      );
      if (!existing.some((index) => index.name === name) && !hasEquivalentIndex) {
        await queryInterface.addIndex(table, fields, { name });
      }
    }
  },

  async down(queryInterface) {
    for (const [table, , name] of [...INDEXES].reverse()) {
      const existing = await queryInterface.showIndex(table);
      if (existing.some((index) => index.name === name)) {
        await queryInterface.removeIndex(table, name);
      }
    }

    await queryInterface.sequelize.query(
      `DELETE FROM roles_permissions
       WHERE permission_id IN (SELECT id FROM permissions WHERE name IN (:permissionNames))`,
      { replacements: { permissionNames: REPORT_PERMISSIONS.map(([name]) => name) } },
    );
    await queryInterface.sequelize.query(
      'DELETE FROM permissions WHERE name IN (:permissionNames)',
      { replacements: { permissionNames: REPORT_PERMISSIONS.map(([name]) => name) } },
    );
  },
};
