require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Database connection
let pool;
(async () => {
  pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('Connected to MySQL database');
})();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded)
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check specific roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
    }
    
    next();
  };
};

// Routes
app.post('/api/register', upload.single('profilePicture'), async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone = null,
        role = 'user',
        serviceType = null,
        description = null,
        experienceYears = null,
      } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const profilePictureUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const userId = uuidv4(); // ✅ Define userId here before using it
  
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
  
        // ✅ Insert into users
        await connection.execute(
          'INSERT INTO users (user_id, name, email, password_hash, phone, profile_picture_url, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, name, email, hashedPassword, phone, profilePictureUrl, role]
        );
  
        // ✅ Insert into providers if needed
        if (role === 'provider') {
          if (!serviceType) {
            await connection.rollback();
            return res.status(400).json({ message: 'Service type is required for providers' });
          }
  
          await connection.execute(
            'INSERT INTO providers (user_id, service_type, description, experience_years) VALUES (?, ?, ?, ?)',
            [userId, serviceType, description || null, experienceYears || null]
          );
        }
  
        await connection.commit();
  
        // ✅ Fetch inserted user
        const [users] = await pool.execute(
          'SELECT user_id, name, email, phone, profile_picture_url, role FROM users WHERE user_id = ?',
          [userId]
        );
  
        const user = users[0];
  
        const token = jwt.sign({ id: user.user_id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
          expiresIn: '7d',
        });
  
        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePicture: user.profile_picture_url,
          },
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Error registering user.' });
    }
  });
  
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const [users] = await pool.execute(
      'SELECT user_id, email, password_hash, name, profile_picture_url, role FROM users WHERE email = ?', 
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    const user = users[0];
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    // console.log(validPassword)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    // Get provider information if user is a provider
    let providerData = null;
    if (user.role === 'provider') {
      const [providers] = await pool.execute(
        'SELECT provider_id, service_type, description, experience_years, is_approved, rating FROM providers WHERE user_id = ?',
        [user.user_id]
      );
      
      if (providers.length > 0) {
        providerData = providers[0];
      }
    }
    
    const token = jwt.sign(
      { 
        id: user.user_id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profile_picture_url,
        provider: providerData
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in.' });
  }
});



// Get current user profile (updated to match frontend expectations)
app.get('/api/profile', authenticate, async (req, res) => {
  try {
      const [users] = await pool.execute(
          'SELECT user_id as id, name, email, phone, profile_picture_url as profilePicture, role, is_verified as isVerified FROM users WHERE user_id = ?',
          [req.user.id]
      );
      
      if (users.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }
      
      const user = users[0];
      
      // Get provider information if user is a provider
      let provider = null;
      if (user.role === 'provider') {
          const [providers] = await pool.execute(
              'SELECT provider_id, service_type, description, experience_years, is_approved, rating FROM providers WHERE user_id = ?',
              [user.id]
          );
          
          if (providers.length > 0) {
              provider = providers[0];
              provider.is_approved = Boolean(provider.is_approved);
              
              // Get provider's services
              const [services] = await pool.execute(
                  `SELECT 
                      s.service_id, s.title, s.description, s.category, s.base_price, 
                      s.duration_minutes, s.is_active, s.created_at,
                      (SELECT image_url FROM service_images WHERE service_id = s.service_id AND is_primary = TRUE LIMIT 1) AS primary_image_url
                  FROM services s
                  WHERE s.provider_id = ?`,
                  [provider.provider_id]
              );
              
              provider.services = services.map(service => ({
                  ...service,
                  is_active: Boolean(service.is_active),
                  base_price: parseFloat(service.base_price)
              }));
          }
      }
      
      // Get user's bookings
      const [bookings] = await pool.execute(
          `SELECT 
              b.booking_id, b.service_id, b.provider_id, b.booking_date, 
              b.status, b.address, b.payment_status, b.total_amount,
              s.title AS service_title, 
              u.name AS provider_name
          FROM bookings b
          JOIN services s ON b.service_id = s.service_id
          JOIN providers p ON b.provider_id = p.provider_id
          JOIN users u ON p.user_id = u.user_id
          WHERE b.user_id = ?
          ORDER BY b.booking_date DESC`,
          [user.id]
      );
      
      const formattedBookings = bookings.map(booking => ({
          ...booking,
          total_amount: parseFloat(booking.total_amount),
          booking_date: new Date(booking.booking_date).toISOString()
      }));
      
      res.json({
          ...user,
          isVerified: Boolean(user.isVerified),
          provider,
          bookings: formattedBookings
      });
  } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile (updated with better error handling)
app.put('/api/profile', authenticate, upload.single('profilePicture'), async (req, res) => {
  try {
      const { name, phone } = req.body;
      
      // Validate input
      if (!name && !phone && !req.file) {
          return res.status(400).json({ message: 'At least one field must be provided for update' });
      }
      
      // Prepare update fields
      const updates = [];
      const params = [];
      
      if (name) {
          updates.push('name = ?');
          params.push(name);
      }
      
      if (phone !== undefined) {
          updates.push('phone = ?');
          params.push(phone || null); // Allow setting phone to null
      }
      
      let profilePictureUrl;
      if (req.file) {
          profilePictureUrl = `/uploads/${req.file.filename}`;
          updates.push('profile_picture_url = ?');
          params.push(profilePictureUrl);
      }
      
      // Add user ID to params
      params.push(req.user.id);
      
      // Execute update
      await pool.execute(
          `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
          params
      );
      
      // Get updated user
      const [users] = await pool.execute(
          'SELECT user_id as id, name, email, phone, profile_picture_url as profilePicture, role FROM users WHERE user_id = ?',
          [req.user.id]
      );
      
      if (users.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }
      
      const user = users[0];
      
      res.json({
          ...user,
          profilePicture: user.profilePicture || null
      });
  } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Get services
app.get('/api/services', async (req, res) => {
  try {
    const { 
      category, 
      location, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build WHERE clause based on filters
    const conditions = ['s.is_active = TRUE', 'p.is_approved = TRUE'];
    const params = [];
    
    if (category) {
      conditions.push('s.category = ?');
      params.push(category);
    }
    
    if (location) {
      // Support for exact location match or partial match
      conditions.push('(u.location = ? OR u.location LIKE ?)');
      params.push(location, `%${location}%`);
    }
    
    if (minPrice) {
      conditions.push('s.base_price >= ?');
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      conditions.push('s.base_price <= ?');
      params.push(parseFloat(maxPrice));
    }
    
    if (search) {
      conditions.push('(s.title LIKE ? OR s.description LIKE ? OR p.service_type LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Validate sort parameters to prevent SQL injection
    const allowedSortColumns = ['created_at', 'base_price', 'rating', 'title'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Base query for services
    const servicesQuery = `
      SELECT 
        s.service_id,
        s.title,
        s.base_price,
        s.category,
        s.description,
        s.duration_minutes,
        p.provider_id,
        p.service_type,
        p.experience_years,
        p.rating AS provider_rating,
        u.user_id,
        u.name AS provider_name,
        u.profile_picture_url,
        u.location,
        (SELECT image_url 
         FROM service_images 
         WHERE service_id = s.service_id AND is_primary = TRUE 
         LIMIT 1) AS primary_image_url,
        (SELECT COUNT(*) 
         FROM reviews r 
         JOIN bookings b ON r.booking_id = b.booking_id 
         WHERE b.service_id = s.service_id) AS review_count
      FROM services s
      JOIN providers p ON s.provider_id = p.provider_id
      JOIN users u ON p.user_id = u.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortColumn === 'rating' ? 'p.rating' : `s.${sortColumn}`} ${order}
    `;
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      JOIN providers p ON s.provider_id = p.provider_id
      JOIN users u ON p.user_id = u.user_id
      WHERE ${conditions.join(' AND ')}
    `;
    
    // Execute both queries in parallel
    const [services, [totalResult]] = await Promise.all([
      pool.query(servicesQuery, [...params, parseInt(limit), parseInt(offset)]),
      pool.query(countQuery, params)
    ]);
    
    const totalServices = totalResult.total;
    const totalPages = Math.ceil(totalServices / limit);
    
    res.status(200).json({
      services: services[0],
      // pagination: {
      //   totalServices,
      //   totalPages,
      //   currentPage: parseInt(page),
      //   servicesPerPage: parseInt(limit),
      //   hasNextPage: page < totalPages,
      //   hasPreviousPage: page > 1
      // },
      filters: {
        applied: {
          category,
          location,
          minPrice,
          maxPrice,
          search
        },
        availableLocations: ['Hyderabad', 'Siddipet', 'Karimnagar']
      }
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// Get service details
app.get('/api/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const [services] = await pool.query(`
      SELECT 
        s.service_id,
        s.title,
        s.base_price,
        s.category,
        s.description,
        s.duration_minutes,
        p.provider_id,
        p.service_type,
        p.description AS provider_description,
        p.experience_years,
        p.rating AS provider_rating,
        u.user_id,
        u.name AS provider_name,
        u.profile_picture_url AS provider_image
      FROM services s
      JOIN providers p ON s.provider_id = p.provider_id
      JOIN users u ON p.user_id = u.user_id
      WHERE s.service_id = ? AND s.is_active = TRUE
    `, [serviceId]);

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const service = services[0];

    // Get service images
    const [images] = await pool.query(`
      SELECT image_id, image_url, is_primary
      FROM service_images
      WHERE service_id = ?
      ORDER BY is_primary DESC
    `, [serviceId]);

    // Get reviews for this service
    const [reviews] = await pool.query(`
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS user_name,
        u.profile_picture_url AS user_image
      FROM reviews r
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN users u ON r.user_id = u.user_id
      WHERE b.service_id = ?
      ORDER BY r.created_at DESC
    `, [serviceId]);

    res.json({
      ...service,
      images,
      reviews,
      review_count: reviews.length
    });
  } catch (err) {
    console.error('Error fetching service details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new service (providers only)
app.post('/api/services', authenticate, authorize(['provider']), upload.array('images', 5), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { title, description, category, basePrice, durationMinutes } = req.body;

    // Validate inputs
    if (!title?.trim() || !description?.trim() || !category?.trim() || basePrice === undefined) {
      return res.status(400).json({ message: 'Title, description, category and base price are required' });
    }

    const numericPrice = parseFloat(basePrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Get provider ID for the authenticated user
    const [providers] = await connection.query(
      'SELECT provider_id FROM providers WHERE user_id = ?',
      [req.user.id]
    );

    if (providers.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: 'Provider record not found for this user' });
    }

    const providerId = providers[0].provider_id;

    // Generate UUID for service_id
    const serviceId = uuidv4();

    // Insert service
    await connection.execute(
      'INSERT INTO services (service_id, provider_id, title, description, category, base_price, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [serviceId, providerId, title.trim(), description.trim(), category.trim(), numericPrice, durationMinutes || null]
    );

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      let isPrimary = true;

      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;

        await connection.execute(
          'INSERT INTO service_images (image_id, service_id, image_url, is_primary) VALUES (?, ?, ?, ?)',
          [uuidv4(), serviceId, imageUrl, isPrimary]
        );

        isPrimary = false;
      }
    }

    await connection.commit();

    res.status(201).json({
      serviceId,
      title,
      description,
      category,
      basePrice: numericPrice,
      durationMinutes: durationMinutes || null,
      message: 'Service created successfully'
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Error creating service' });
  } finally {
    connection.release();
  }
});

app.post('/api/bookings', authenticate, authorize(['user']), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Extract data from request body - using camelCase as sent from frontend
    const { serviceId, providerId, bookingDate, specialRequests, address, totalAmount } = req.body;
    
    // Validate required fields
    if (!serviceId || !bookingDate || !address || !totalAmount) {
      return res.status(400).json({ 
        message: 'Missing required fields: serviceId, bookingDate, address and totalAmount are required' 
      });
    }

    // Validate providerId is provided
    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }
    
    // Optional: Verify that the service exists and is active
    const [services] = await connection.query(
      'SELECT service_id, provider_id, is_active FROM services WHERE service_id = ?',
      [serviceId]
    );
    
    if (services.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = services[0];
    
    // Check if service is active
    if (!service.is_active) {
      await connection.rollback();
      return res.status(400).json({ message: 'This service is currently unavailable' });
    }

    // Verify that providerId matches the service's provider_id
    if (service.provider_id !== providerId) {
      await connection.rollback();
      return res.status(400).json({ message: 'Provider ID does not match the service provider' });
    }
    
    // Create the booking
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings 
        (user_id, service_id, provider_id, booking_date, special_requests, address, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, // Assuming req.user.id comes from authentication middleware
        serviceId, 
        providerId, 
        new Date(bookingDate), 
        specialRequests || null, 
        address, 
        parseFloat(totalAmount)
      ]
    );
    
    // Get the generated booking ID
    const bookingId = bookingResult.insertId || bookingResult.lastInsertId;
    
    // Commit the transaction if everything is successful
    await connection.commit();
    
    // Send success response
    res.status(201).json({
      success: true,
      bookingId: bookingId,
      status: 'pending',
      paymentStatus: 'pending',
      message: 'Booking created successfully'
    });
  } catch (err) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Error creating booking:', err);
    
    // Send appropriate error response
    if (err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ message: 'Invalid service, provider, or user ID' });
    }
    
    res.status(500).json({ message: 'Server error while creating booking' });
  } finally {
    // Always release the connection
    connection.release();
  }
});


app.get('/api/bookings/my-bookings', authenticate, authorize(['user']), async (req, res) => {
  try {
    // Add debugging to help identify issues
    console.log('User ID from token:', req.user.id);
    
    // First check if the user exists
    const [users] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use a simpler query first to identify if there are any join issues
    const [bookings] = await pool.query(`
      SELECT 
        b.booking_id, 
        b.booking_date, 
        b.status, 
        b.special_requests, 
        b.address, 
        b.payment_status, 
        b.total_amount,
        s.title AS service_title,
        u.name AS provider_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.service_id
      LEFT JOIN providers p ON b.provider_id = p.provider_id
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `, [req.user.id]);

    // console.log('Bookings found:', bookings.length);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    // More detailed error information
    res.status(500).json({ 
      message: 'Error fetching bookings',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get provider's bookings
app.get('/api/provider/bookings', authenticate, authorize(['provider']), async (req, res) => {
  try {
    // Get provider ID
    const [providers] = await pool.query(
      'SELECT provider_id FROM providers WHERE user_id = ?',
      [req.user.id]
    );
    
    if (providers.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const providerId = providers[0].provider_id;
    
    // Get bookings
    const [bookings] = await pool.query(`
      SELECT 
        b.booking_id, 
        b.user_id,
        b.service_id, 
        b.booking_date, 
        b.status, 
        b.special_requests,
        b.address, 
        b.payment_status, 
        b.total_amount,
        b.created_at,
        s.title AS service_title,
        u.name AS client_name,
        u.profile_picture_url AS client_image
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.provider_id = ?
      ORDER BY b.booking_date DESC
    `, [providerId]);
    
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching provider bookings:', err);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Admin routes
// Get all users (admin only)
app.get('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        user_id, 
        name, 
        email, 
        phone, 
        profile_picture_url, 
        role, 
        is_verified, 
        created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get providers pending approval (admin only)
app.get('/api/admin/providers/pending', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [providers] = await pool.query(`
      SELECT 
        p.provider_id, 
        p.user_id, 
        p.service_type, 
        p.description, 
        p.experience_years, 
        p.created_at,
        u.name,
        u.email,
        u.profile_picture_url
      FROM providers p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_approved = FALSE
      ORDER BY p.created_at ASC
    `);
    
    res.json(providers);
  } catch (err) {
    console.error('Error fetching pending providers:', err);
    res.status(500).json({ message: 'Error fetching pending providers' });
  }
});

// Approve provider (admin only)
app.put('/api/admin/providers/:providerId/approve', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { providerId } = req.params;
    
    await pool.execute(
      'UPDATE providers SET is_approved = TRUE WHERE provider_id = ?',
      [providerId]
    );
    
    res.json({ message: 'Provider approved successfully' });
  } catch (err) {
    console.error('Error approving provider:', err);
    res.status(500).json({ message: 'Error approving provider' });
  }
});

// GET all providers
app.get('/api/providers', async (req, res) => {
  try {
    // Filter parameters
    const { serviceType, isApproved, minRating } = req.query;

    // Base query
    let query = `
      SELECT 
        p.provider_id, 
        p.user_id, 
        p.service_type, 
        p.description, 
        p.experience_years, 
        p.is_approved, 
        p.rating,
        p.created_at,
        u.name as provider_name,
        u.profile_picture_url,
        u.email,
        u.phone
      FROM providers p
      JOIN users u ON p.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (serviceType) {
      query += ' AND p.service_type LIKE ?';
      params.push(`%${serviceType}%`);
    }
    if (isApproved !== undefined) {
      query += ' AND p.is_approved = ?';
      params.push(isApproved === 'true');
    }
    if (minRating && !isNaN(minRating)) {
      query += ' AND p.rating >= ?';
      params.push(parseFloat(minRating));
    }

    // Execute query
    const [providers] = await pool.execute(query, params);

    // Get services for each provider
    for (const provider of providers) {
      const [services] = await pool.execute(
        'SELECT * FROM services WHERE provider_id = ? AND is_active = TRUE',
        [provider.provider_id]
      );
      provider.services = services;
    }

    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// GET single provider by ID
app.get('/api/providers/:id', async (req, res) => {
  try {
    const providerId = req.params.id;

    // Get provider details
    const [providers] = await pool.execute(
      `SELECT 
        p.*, 
        u.name as provider_name,
        u.profile_picture_url,
        u.email,
        u.phone
       FROM providers p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.provider_id = ?`,
      [providerId]
    );

    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = providers[0];

    // Get provider's services
    const [services] = await pool.execute(
      'SELECT * FROM services WHERE provider_id = ? AND is_active = TRUE',
      [providerId]
    );
    provider.services = services;

    // Get provider's documents
    const [documents] = await pool.execute(
      'SELECT * FROM provider_documents WHERE provider_id = ?',
      [providerId]
    );
    provider.documents = documents;

    // Get provider's reviews
    const [reviews] = await pool.execute(
      `SELECT 
        r.*, 
        u.name as reviewer_name,
        u.profile_picture_url as reviewer_photo
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.provider_id = ?`,
      [providerId]
    );
    provider.reviews = reviews;

    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new provider
app.post('/api/providers', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_id, service_type, description, experience_years } = req.body;

    // Check if user exists and has provider role
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE user_id = ? AND role = "provider"',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'User not found or not a provider' });
    }

    // Check if provider already exists for this user
    const [existingProviders] = await pool.execute(
      'SELECT * FROM providers WHERE user_id = ?',
      [user_id]
    );

    if (existingProviders.length > 0) {
      return res.status(400).json({ error: 'Provider profile already exists for this user' });
    }

    // Create new provider
    const [result] = await pool.execute(
      `INSERT INTO providers 
       (user_id, service_type, description, experience_years) 
       VALUES (?, ?, ?, ?)`,
      [user_id, service_type, description, experience_years || null]
    );

    const [newProvider] = await pool.execute(
      'SELECT * FROM providers WHERE provider_id = ?',
      [result.insertId]
    );

    res.status(201).json(newProvider[0]);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update provider
app.put('/api/providers/:id', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const providerId = req.params.id;
    const { service_type, description, experience_years, is_approved, rating } = req.body;

    // Check if provider exists
    const [providers] = await pool.execute(
      'SELECT * FROM providers WHERE provider_id = ?',
      [providerId]
    );

    if (providers.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (service_type !== undefined) {
      updateFields.push('service_type = ?');
      updateValues.push(service_type);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (experience_years !== undefined) {
      updateFields.push('experience_years = ?');
      updateValues.push(experience_years);
    }
    if (is_approved !== undefined) {
      updateFields.push('is_approved = ?');
      updateValues.push(is_approved);
    }
    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(providerId);

    const query = `
      UPDATE providers 
      SET ${updateFields.join(', ')} 
      WHERE provider_id = ?
    `;

    await pool.execute(query, updateValues);

    // Return updated provider
    const [updatedProvider] = await pool.execute(
      'SELECT * FROM providers WHERE provider_id = ?',
      [providerId]
    );

    res.json(updatedProvider[0]);
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/provider/dashboard', authenticate, async (req, res) => {
  try {
    // Validate authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing user data' });
    }

    const userId = req.user.id;

    // 1. Get user information
    const [users] = await pool.execute(
      `SELECT 
        user_id as id, 
        name, 
        email, 
        phone, 
        profile_picture_url as profilePicture, 
        role, 
        is_verified as isVerified,
        location
      FROM users 
      WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // 2. Get provider-specific information
    const [providers] = await pool.execute(
      `SELECT 
        provider_id as id,
        service_type as serviceType,
        description,
        experience_years as experienceYears,
        is_approved as isApproved,
        rating,
        created_at as createdAt
      FROM providers 
      WHERE user_id = ?`,
      [user.id]
    );

    if (providers.length === 0) {
      return res.status(403).json({ message: 'User is not a registered provider' });
    }

    const providerInfo = providers[0];

    // 3. Get provider's services
    const [services] = await pool.execute(
      `SELECT 
        service_id as id,
        title as serviceTitle,
        description,
        category as serviceType,
        base_price as basePrice,
        duration_minutes as durationMinutes,
        is_active as isActive,
        created_at as createdAt,
        (
          SELECT image_url 
          FROM service_images 
          WHERE service_id = services.service_id AND is_primary = TRUE 
          LIMIT 1
        ) as imageUrl
      FROM services
      WHERE provider_id = ?`,
      [providerInfo.id]
    );

    // 4. Get recent bookings
    const [bookings] = await pool.execute(
      `SELECT 
        b.booking_id as id,
        b.service_id as serviceId,
        b.booking_date as bookingDate,
        b.status,
        b.address,
        b.payment_status as paymentStatus,
        b.total_amount as totalAmount,
        u.name as customerName,
        u.user_id as customerId,
        s.title as serviceTitle
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN services s ON b.service_id = s.service_id
      WHERE b.provider_id = ?
      ORDER BY b.booking_date DESC
      LIMIT 5`,
      [providerInfo.id]
    );

    // Prepare response
    const response = {
      provider: {
        ...user,
        ...providerInfo,
        isVerified: Boolean(user.isVerified),
        isApproved: Boolean(providerInfo.isApproved),
      },
      services: services.map(service => ({
        ...service,
        basePrice: parseFloat(service.basePrice),
        isActive: Boolean(service.isActive),
      })),
      recentBookings: bookings.map(booking => ({
        ...booking,
        totalAmount: parseFloat(booking.totalAmount),
        bookingDate: new Date(booking.bookingDate).toISOString(),
      })),
      stats: {
        totalServices: services.length,
        activeServices: services.filter(s => s.isActive).length,
        upcomingBookings: bookings.filter(b => new Date(b.bookingDate) > new Date()).length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
      },
    };

    res.json(response);

  } catch (err) {
    console.error('🔥 Error fetching provider dashboard:', err);
    res.status(500).json({ message: 'Error fetching provider dashboard', error: err.message });
  }
});

// Helper function to validate booking status transitions
function isValidStatusTransition(currentStatus, newStatus) {
  // Define valid transitions
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled'],
    'completed': [], // Cannot transition from completed
    'cancelled': []  // Cannot transition from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}/**
 * API endpoint for providers to update booking status
 * Route: PUT /api/provider/bookings/:bookingId
 * Add this to your main server.js file
 */

// Middleware to verify the provider
const verifyProvider = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user is a provider
    const [provider] = await pool.query(
      'SELECT provider_id FROM providers WHERE user_id = ?', 
      [userId]
    );
    
    if (provider.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. User is not a provider.' 
      });
    }
    
    req.providerId = provider[0].provider_id;
    next();
  } catch (error) {
    console.error('Provider verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while verifying provider status.' 
    });
  }
};

// Update booking status
app.put('/api/provider/bookings/:bookingId', authenticate, verifyProvider, async (req, res) => {
  const { bookingId } = req.params;
  const { action } = req.body;
  const providerId = req.providerId;

  try {
    // Validate the action
    if (!action || !['confirm', 'complete', 'cancel'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action. Allowed actions are: confirm, complete, cancel.' 
      });
    }

    // Verify the booking belongs to this provider
    const [booking] = await pool.query(
      'SELECT booking_id, status FROM bookings WHERE booking_id = ? AND provider_id = ?',
      [bookingId, providerId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found or does not belong to this provider.' 
      });
    }

    // Get the current status
    const currentStatus = booking[0].status;

    // Define the new status based on action
    let newStatus;
    switch (action) {
      case 'confirm':
        newStatus = 'confirmed';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
    }

    // Validate the status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change booking status from '${currentStatus}' to '${newStatus}'.` 
      });
    }

    // Update the booking status in the database
    await pool.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      [newStatus, bookingId]
    );

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: `Booking has been ${newStatus}.`,
      bookingId,
      status: newStatus
    });
    
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating booking status.' 
    });
  }
});

// Add this route to your existing index.js
app.put('/api/bookings/:id/cancel', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id; // From auth middleware

  try {
    // 1. Get booking
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [id]
    );

    if (booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const currentBooking = booking[0];

    // 2. Check if the user owns this booking
    if (currentBooking.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to cancel this booking' });
    }

    // 3. Prevent canceling completed or already cancelled bookings
    if (currentBooking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (currentBooking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });
    }

    // 4. Check 24-hour cancellation policy
    const bookingTime = new Date(currentBooking.booking_date);
    const currentTime = new Date();
    const hoursUntilBooking = (bookingTime - currentTime) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return res.status(400).json({ 
        message: 'Cancellations require at least 24 hours notice' 
      });
    }

    // 5. Cancel the booking
    await pool.query(
      'UPDATE bookings SET status = "cancelled" WHERE booking_id = ?',
      [id]
    );

    // 6. If paid, mark for refund
    if (currentBooking.payment_status === 'paid') {
      await pool.query(
        'UPDATE bookings SET payment_status = "refund_pending" WHERE booking_id = ?',
        [id]
      );

      // Optional: trigger refund logic here
      // await refundPayment(currentBooking.booking_id, currentBooking.total_amount);
    }

    // 7. Respond to client
    res.json({ 
      success: true,
      message: 'Booking cancelled successfully',
      booking_id: id,
      new_status: 'cancelled'
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to cancel booking',
      error: error.message 
    });
  }
});


app.delete('/api/admin/providers/:providerId', async (req, res) => {
  const { providerId } = req.params;

  try {
    // Check if provider exists
    const [rows] = await pool.query('SELECT * FROM providers WHERE provider_id = ?', [providerId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Delete the provider
    await pool.query('DELETE FROM providers WHERE provider_id = ?', [providerId]);

    // Optionally: Delete related user if needed
    const userId = rows[0].user_id;
    await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);

    res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));