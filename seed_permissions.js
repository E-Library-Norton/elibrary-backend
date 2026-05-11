const dotenv = require("dotenv");
dotenv.config({ path: ['.env.local', '.env'] });

const { sequelize, Permission } = require('./src/models');

async function seed() {
  await sequelize.authenticate();
  console.log("Connected to database at:", sequelize.config.host);
  
  const permissions = [
    { id: 1, name: 'users.view',         description: 'View users' },
    { id: 2, name: 'users.create',       description: 'Create users' },
    { id: 3, name: 'users.update',       description: 'Update users' },
    { id: 4, name: 'users.delete',       description: 'Delete users' },
    { id: 5, name: 'roles.view',         description: 'View roles' },
    { id: 6, name: 'roles.create',       description: 'Create roles' },
    { id: 7, name: 'roles.update',       description: 'Update roles' },
    { id: 8, name: 'roles.delete',       description: 'Delete roles' },
    { id: 9,  name: 'permissions.view',   description: 'View permissions' },
    { id: 10, name: 'permissions.create', description: 'Create permissions' },
    { id: 11, name: 'permissions.update', description: 'Update permissions' },
    { id: 12, name: 'permissions.delete', description: 'Delete permissions' },
    { id: 13, name: 'permissions.assign', description: 'Assign permissions to roles' },
    { id: 14, name: 'books.view',         description: 'View books' },
    { id: 15, name: 'books.create',       description: 'Create books' },
    { id: 16, name: 'books.update',       description: 'Update books' },
    { id: 17, name: 'books.delete',       description: 'Delete books' },
    { id: 18, name: 'books.download',     description: 'Download books' },
  ];

  for (const p of permissions) {
    await Permission.upsert({ ...p, id: undefined, name: p.name, description: p.description }, { conflictFields: ['name'] });
  }
  
  console.log("✅ Seeded permissions successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Failed to seed:", err);
  process.exit(1);
});
