# CourseAI Backend

## MongoDB Atlas Setup

### 1. Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in to your account
3. Select your cluster
4. Click "Connect" button
5. Choose "Connect your application"
6. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Update Your .env File

Replace the `MONGODB_URI` in your `.env` file with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/courseai?retryWrites=true&w=majority
```

**Important:** 
- Replace `your_username` with your Atlas database username
- Replace `your_password` with your Atlas database password  
- Replace `your_cluster` with your actual cluster name
- The database name `courseai` will be created automatically

### 3. Whitelist Your IP Address

1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Either:
   - Add your current IP address, OR
   - Add `0.0.0.0/0` to allow access from anywhere (for development only)

### 4. Create Database User (if not done)

1. Go to "Database Access" in Atlas
2. Click "Add New Database User"
3. Create a user with read/write permissions
4. Use these credentials in your connection string

## Running the Backend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will start on port 8000 and connect to your MongoDB Atlas cluster.

## Environment Variables Required

```env
PORT=8000
MONGODB_URI=your_atlas_connection_string
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Course AI <noreply@your-domain.com>
NODE_ENV=development
```
