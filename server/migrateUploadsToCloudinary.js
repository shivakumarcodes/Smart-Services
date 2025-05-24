const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const mysql = require('mysql2/promise');

// Cloudinary config
cloudinary.config({
  cloud_name: 'do5aecy6u',
  api_key: '253664263519732',
  api_secret: 'qZznvmX9sypMoP7NPFpap9Cf3-Q',
});

(async () => {
  const pool = await mysql.createPool({
    host: 'smart-services.ct066qgye9u8.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: '#Shiva123',
    database: 'smart_services',
  });

  const [users] = await pool.execute('SELECT user_id, profile_picture_url FROM users');

  for (const user of users) {
    if (user.profile_picture_url?.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, user.profile_picture_url);
      if (fs.existsSync(localPath)) {
        try {
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'smart-services-users',
          });

          await pool.execute('UPDATE users SET profile_picture_url = ? WHERE user_id = ?', [
            result.secure_url,
            user.user_id,
          ]);

          console.log(`✅ Migrated: ${user.user_id}`);
        } catch (err) {
          console.error(`❌ Failed for ${user.user_id}`, err);
        }
      }
    }
  }

  await pool.end();
})();
