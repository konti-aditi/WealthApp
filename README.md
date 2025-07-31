# WealthApp Full-Stack Application

 
[Live Site](https://wealth-map.netlify.app/)  
[Demo Video](https://www.loom.com/share/9f8cc9308df1419694d67a4de061a2df?sid=b425445f-1e2c-46af-928c-86c967f18e47)  
[Figma Design](https://www.figma.com/design/0D7dVVaMLc17AsLdRhgyNq/WealthApp?node-id=1-2&t=QAcav5KtgxRuHLNR-1)

WealthMap is a full-stack application that helps users manage and visualize wealth-related data using maps and intuitive UI. The project is built using **React 19**, **Vite**, **Tailwind CSS**, and **TanStack Router** on the frontend, with a **Node.js**, **Express**, and **MongoDB** backend. It also supports features like Google Maps integration, JWT authentication, cloud storage, and scheduled tasks.

---

## Key Features

- Company Registration & Role-Based Access  
- Interactive Property Mapping  
- Property Details with Ownership History  
- Owner Net Worth Estimation  
- Advanced Search & Filtering  
- Third-Party API Integration (Zillow, PitchBook, etc.)  

---

## Tech Stack

### Frontend

- React 19 with Vite  
- Tailwind CSS 4 + Tailwind Plugins  
- TanStack Router & React Query  
- Radix UI + Lucide Icons  
- Google Maps API  
- React Hook Form  
- TypeScript  

### Backend

- Node.js + Express  
- MongoDB (via Mongoose)  
- JWT Authentication  
- Google Cloud Storage  
- Nodemailer for Emails  
- MQTT + node-cron  

---

## Project Structure

```plaintext
wealthmap
  - frontend/ # React + Vite app
  - backend/  # Node.js + Express server
```


## Getting Started
## Prerequisites
Node.js v18+
Yarn or npm
MongoDB Atlas or Local instance
Google Cloud Project with Storage enabled

---

## Installation Instructions
Clone the Repository

```
git clone https://github.com/Aditys018/WealthApp.git
cd WealthApp
```

Set Up Environment Variables
Backend .env
Create a .env file inside the backend/ folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
GCLOUD_PROJECT=your_project_id
GCLOUD_CLIENT_EMAIL=your_client_email
GCLOUD_PRIVATE_KEY=your_private_key
GCLOUD_BUCKET=your_bucket_name
```

Frontend .env
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Running the App Locally
Frontend
```
cd frontend
yarn install
yarn dev
```

Backend
```
cd backend
yarn install
yarn dev:server
```

<details>
  <summary><strong>API Docuemntation</strong></summary>

### Authentication APIs
- `POST /user/login` 
  - **Description**: Login with email and password (triggers OTP email)
  - **Request Body**: 
    - `email` (string, required): User's email address
    - `password` (string, required): User's password
  - **Response**: OTP details for verification

- `POST /user/verify-otp` 
  - **Description**: Verify the OTP sent during login
  - **Request Body**: 
    - `email` (string, required): User's email address
    - `otp` (string, required): One-time password received via email
    - `otpId` (string, required): OTP identifier
  - **Response**: Authentication tokens and user details

- `POST /user/resend-otp` 
  - **Description**: Request a new OTP for verification
  - **Request Body**: 
    - `email` (string, required): User's email address
  - **Response**: New OTP details

- `POST /user/change-password` 
  - **Description**: Change user password
  - **Request Body**: 
    - `oldPassword` (string, required): Current password
    - `newPassword` (string, required): New password (min 8 characters)
  - **Response**: Success message

- `GET /user/random-wealth` 
  - **Description**: Get random wealth information
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN, EMPLOYEE)
  - **Response**: Random wealth data

- `POST /user/upload` 
  - **Description**: Upload files
  - **Request Body**: 
    - Files (multipart/form-data)
  - **Response**: Uploaded file links

### Identity APIs
- `POST /identity/token` 
  - **Description**: Get a new access token using a refresh token
  - **Request Body**: 
    - `refreshToken` (string, required): Valid refresh token
  - **Response**: New access token

- `POST /identity/send-otp` 
  - **Description**: Send an OTP to an email address
  - **Request Body**: 
    - `firstName` (string, required): Recipient's first name
    - `email` (string, required): Recipient's email address
  - **Response**: OTP details

### Company APIs

#### Company Management
- `POST /company/register` 
  - **Description**: Register a new company (automatically becomes company admin)
  - **Request Body**: 
    - `name` (string, required): Company name
    - `logo` (string, optional): Company logo URL
    - `description` (string, optional): Company description
    - `website` (string, optional): Company website URL
    - `industry` (string, optional): Company industry
    - `email` (string, required): Admin email
    - `password` (string, required): Admin password (min 8 chars, must include uppercase, lowercase, number, special char)
    - `otp` (string, required): OTP for verification
    - `otpId` (string, required): OTP identifier
    - `size` (string, optional): Company size (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
    - `address` (object, optional): Company address
    - `contactEmail` (string, optional): Contact email
    - `contactPhone` (string, optional): Contact phone
    - `dataAccessPreferences` (object, optional): Data access preferences
  - **Response**: Company and admin details

- `PUT /company/:id` 
  - **Description**: Update a company's information
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN)
  - **Path Parameters**:
    - `id` (string, required): Company ID
  - **Request Body**: Company data to update
  - **Response**: Updated company details

#### Employee Management
- `POST /company/:companyId/employees/invite` 
  - **Description**: Invite an employee to join the company
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN)
  - **Path Parameters**:
    - `companyId` (string, required): Company ID
  - **Request Body**: 
    - `email` (string, required): Employee's email
    - `role` (string, required): Employee's role
    - `firstName` (string, optional): Employee's first name
    - `lastName` (string, optional): Employee's last name
  - **Response**: Employee details

- `GET /company/:companyId/employees` 
  - **Description**: Get all employees of a company
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN)
  - **Path Parameters**:
    - `companyId` (string, required): Company ID
  - **Response**: List of employees

- `DELETE /company/:companyId/employees/:employeeId` 
  - **Description**: Revoke an employee's access
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN)
  - **Path Parameters**:
    - `companyId` (string, required): Company ID
    - `employeeId` (string, required): Employee ID
  - **Response**: Success message

- `GET /company/:companyId/employees/:employeeId/activities` 
  - **Description**: Get employee activities
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN)
  - **Path Parameters**:
    - `companyId` (string, required): Company ID
    - `employeeId` (string, required): Employee ID
  - **Response**: Employee activity logs

### Places APIs
- `GET /places/list-properties` 
  - **Description**: Get a list of properties
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN, EMPLOYEE)
  - **Query Parameters**:
    - `lat` (number, optional): Latitude (default: 40.7589)
    - `long` (number, optional): Longitude (default: -73.9851)
    - `radius` (number, optional): Search radius in miles (default: 5)
    - `page` (number, optional): Page number (default: 1)
    - `listingStatus` (string, optional): Listing status (default: "Sold")
    - `propertyType` (string, optional): Property type
  - **Response**: List of properties

- `GET /places/property/:id` 
  - **Description**: Get details of a specific property
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN, EMPLOYEE)
  - **Path Parameters**:
    - `id` (string, required): Property ID
  - **Response**: Property details

- `GET /places/property-types` 
  - **Description**: Get all property types
  - **Authentication**: Required (ADMIN, COMPANY_ADMIN, EMPLOYEE)
  - **Response**: List of property types
    
</details>

For any queries or contributions, please visit the [WealthApp](https://github.com/Aditys018/WealthApp) or create an issue.

