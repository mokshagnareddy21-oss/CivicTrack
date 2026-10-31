# CivicTrack – Public Grievance Tracker

**Tagline:** Every complaint deserves a resolution.

🌐 **Live Deployment:** https://civictrack-ppgc.onrender.com

---

## 1. Project Overview

CivicTrack is a full-stack Public Grievance Tracking System designed to make complaint registration, monitoring and resolution more transparent and accessible.

The platform enables citizens to submit complaints, receive unique tracking IDs and monitor their complaint status. Administrators can manage grievances, assign departments, update redressal status and record official remarks.

**Hackathon Problem Statement:** HACK-P423 – Public Grievance Tracker

## 2. Problem Statement

Citizens often face difficulties submitting grievances, tracking their progress and receiving updates about their resolution.

CivicTrack addresses these challenges through a centralized digital platform that connects citizens and administrators.

## 3. Objectives

- Simplify public grievance registration.
- Provide transparent complaint tracking.
- Improve communication between citizens and administrators.
- Enable efficient complaint assignment and management.
- Maintain a record of complaint status changes and official remarks.

## 4. Key Features

### Citizen Portal
- Citizen registration and login.
- Submit grievances with descriptions, categories and priorities.
- Generate unique complaint tracking IDs.
- Track complaint status.
- View complaint history.

### Administrator Dashboard
- Secure administrator authentication.
- View and manage submitted complaints.
- Assign departments and priorities.
- Update complaint statuses.
- Add official remarks.
- Require resolution notes before resolving complaints.
- Require rejection reasons before rejecting complaints.
- View grievance analytics.

### Security
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Citizen complaint ownership protection.
- API rate limiting.
- Input validation and error handling.

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| Icons | Lucide React |
| Development | VS Code, Google AI Studio |
| Version Control | Git, GitHub |

## 6. System Architecture

The application follows a client-server architecture.

1. Citizens and administrators interact with the React frontend.
2. The frontend communicates with the Express backend through REST APIs.
3. Authentication middleware verifies JWT tokens and user roles.
4. Backend services process grievance operations.
5. Mongoose connects the backend to MongoDB Atlas.
6. Complaint updates are stored in the database and reflected in the tracking interface.

## 7. Database Collections

### Users
Stores user information, authentication details and roles.

### Complaints
Stores complaint information, including:
- Tracking ID
- Complaint title and description
- Category and priority
- Assigned department
- Complaint status
- Resolution notes and rejection reasons
- Timeline and official remarks
- Citizen reference and timestamps

## 8. API Endpoints

Base URL: `/api`

### Authentication – `/api/auth`
- POST – Register a citizen.
- POST – Login.

### Complaints – `/api/complaints`
- POST `/` – Submit a complaint.
- GET `/` – Retrieve complaints according to user permissions.
- GET `/track/:trackingId` – Public complaint tracking.
- GET `/:id` – Retrieve complaint details.
- PATCH `/:id/status` – Update complaint status.
- PATCH `/:id/assign` – Assign department and priority.
- POST `/:id/remarks` – Add official remarks.
- DELETE `/:id` – Delete a complaint (administrator only).

### Analytics – `/api/analytics`
- GET `/overview` – Retrieve dashboard statistics.

### Health – `/api/health`
- GET `/` – Check application and database health.

## 9. Installation and Setup

### Prerequisites
- Node.js
- npm
- MongoDB Atlas account
- Git

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd civictrack
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment variables

Create a `.env` file in the project root.

```env
MONGODB_URI=YOUR_MONGODB_ATLAS_URI
JWT_SECRET=YOUR_SECURE_RANDOM_SECRET
PORT=3000

DEFAULT_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
DEFAULT_ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
DEFAULT_ADMIN_NAME=State Grievance Administrator
DEFAULT_ADMIN_PHONE=YOUR_ADMIN_PHONE

APP_URL=http://localhost:3000
```

Never commit your `.env` file or expose database credentials.

### Step 4: Start the application

```bash
npm run dev
```

Open:

`http://localhost:3000`

## 10. Testing and Build

Run TypeScript checks:

```bash
npm run lint
```

Create the production frontend build:

```bash
npm run build
```

Run resolution and rejection validation tests:

```bash
npm run test:validation
```

## 11. Security and Validation

CivicTrack implements:
- Secure password hashing.
- JWT authentication.
- Role-based API authorization.
- Citizen data isolation.
- Validation of complaint status transitions.
- Mandatory resolution and rejection notes.
- Protection against unauthorized complaint updates.
- Rate limiting for authentication and tracking endpoints.

## 12. Future Enhancements

- Email and SMS notifications.
- AI-powered complaint classification.
- Geographic complaint visualization.
- Department performance analytics.
- Multilingual citizen support.
- Mobile application support.

## 13. Team Information

**Team Name:** Vyntra
**Project:** CivicTrack  
**Problem Statement:** HACK-P423 – Public Grievance Tracker

**Team Members:**
1. U.Vivek Varma – Frontend developer - User interface development, page design and citizen dashboard
2. K.Sirivennela – Backend developer - API development, server-side logic and database integration
3. P.Mokshajna – Full-Stack developer & integration lead - Frontend-backend integration, authentication workflow, deployment and overall project coordination.
4. V.Karthik Reddy – Testing and documentation lead - Application testing, bug identification, README documentation and project presentation.

## 14. Screenshots and Demo

Demo Video - https://drive.google.com/file/d/1ipay9KIIz9P_Z61UObljbjEtfxma5WEx/view?usp=drivesdk


<img width="945" height="488" alt="Screenshot 2026-10-31 164304" src="https://github.com/user-attachments/assets/1ccd464b-4e06-484a-a2b4-1ade4b04bfc8" />
<img width="925" height="419" alt="Screenshot 2026-10-31 164425" src="https://github.com/user-attachments/assets/9f8f9f17-6608-4219-b68f-0dc68df3747a" />
<img width="948" height="493" alt="Screenshot 2026-10-31 164347" src="https://github.com/user-attachments/assets/06eee6e2-8771-4160-bbfe-9fd80453147d" />
<img width="927" height="479" alt="Screenshot 2026-10-31 164439" src="https://github.com/user-attachments/assets/302b19c4-eb6e-4013-979f-90e472a37c60" />




## 15. Conclusion

CivicTrack aims to improve public grievance management by providing citizens with a transparent complaint tracking experience and administrators with an organized grievance management system.

**Every complaint deserves a resolution.**
