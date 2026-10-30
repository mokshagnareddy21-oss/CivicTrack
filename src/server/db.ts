import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.ts';
import { Complaint } from './models/Complaint.ts';

let isConnected = false;
let isConnecting = false;
let lastConnectionError: string | null = null;
let retryInterval: NodeJS.Timeout | null = null;

export async function connectDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (isConnecting) {
    return false;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim().length === 0) {
    lastConnectionError = 'MONGODB_URI environment variable is not defined.';
    console.error('================================================================================');
    console.error('🚨 [CivicTrack Database Error] MONGODB_URI environment variable is missing.');
    console.error('================================================================================');
    return false;
  }

  isConnecting = true;

  try {
    console.log('[CivicTrack DB] Connecting to MongoDB Atlas cluster...');
    
    // Connect strictly to MongoDB Atlas cluster
    await mongoose.connect(mongoUri, {
      dbName: 'civictrack',
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    isConnecting = false;
    lastConnectionError = null;

    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }

    console.log(`[CivicTrack DB] Successfully connected to MongoDB Atlas! (Host: ${mongoose.connection.host})`);

    // Seed default administrator & demonstration records if database is fresh
    await seedInitialData();
    return true;
  } catch (err: any) {
    isConnected = false;
    isConnecting = false;
    lastConnectionError = err.message || 'Unknown Atlas connection failure';

    console.info('[CivicTrack DB Notice] Awaiting Atlas IP whitelist (0.0.0.0/0). Auto-reconnecting in background...');

    // Schedule background retry every 15 seconds if not already scheduled
    if (!retryInterval) {
      retryInterval = setInterval(async () => {
        if (!isConnected && mongoose.connection.readyState !== 1) {
          await connectDB().catch(() => {});
        }
      }, 15000);
    }

    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;
  const connected = readyState === 1;

  return {
    isConnected: connected,
    readyState,
    statusText: connected ? 'connected' : readyState === 2 ? 'connecting' : 'disconnected',
    engine: 'MongoDB Atlas',
    databaseName: mongoose.connection.name || 'civictrack',
    host: mongoose.connection.host || 'cluster0.mongodb.net',
    lastError: lastConnectionError,
    troubleshooting: connected
      ? null
      : 'Please add 0.0.0.0/0 to your MongoDB Atlas Network Access whitelist (Security -> Network Access -> Add IP Address -> Allow Access from Anywhere).',
  };
}

async function seedInitialData() {
  try {
    // 1. Seed Administrator from environment variables
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@civictrack.gov';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@CivicTrack2026';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'State Grievance Administrator';
    const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '+1 (555) 019-2831';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        phone: adminPhone,
        role: 'admin',
        address: 'Municipal Administrative Complex, Block B (Demo)',
        city: 'Metro City (Simulated)',
      });
      console.log(`[CivicTrack Seed] Initialized Administrator: ${adminEmail}`);
    }

    // 2. Seed a Sample Citizen for demonstration
    const citizenEmail = 'citizen.jane@civictrack.org';
    let citizen = await User.findOne({ email: citizenEmail });
    if (!citizen) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Citizen@123', salt);
      citizen = await User.create({
        name: 'Jane Citizen (Demo)',
        email: citizenEmail,
        password: hashedPassword,
        phone: '+1 (555) 782-9014',
        role: 'citizen',
        address: '442 Elmwood Avenue (Demonstration Address)',
        city: 'Metro City (Simulated)',
      });
      console.log(`[CivicTrack Seed] Initialized Demo Citizen: ${citizenEmail}`);
    }

    // 3. Seed Demonstration Complaints if collection is empty
    const count = await Complaint.countDocuments();
    if (count === 0 && citizen) {
      const demonstrationSamples = [
        {
          trackingId: 'CT-2026-WTR892',
          citizenId: citizen._id,
          citizenName: 'Jane Citizen (Demo)',
          citizenEmail: citizen.email,
          citizenPhone: citizen.phone,
          category: 'Water Supply',
          title: '[Demonstration Record] Main water distribution pipe pressure drop',
          description:
            '[Demonstration Record for Portal Evaluation] Low water pressure reported following routine pipeline valve maintenance along Elmwood corridor.',
          location: {
            address: 'Intersection of Elmwood Ave and 5th Cross Road (Demo Locality)',
            city: 'Metro City (Simulated)',
            landmark: 'Near General Hospital Gate 2',
            pincode: '98101',
          },
          priority: 'High',
          assignedDepartment: 'Water Supply & Sewerage Board',
          status: 'In Progress',
          remarks: [
            {
              author: 'State Grievance Administrator',
              role: 'admin',
              comment:
                '[Official Officer Note] Field division 4 dispatched to conduct pressure gauge reading.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
            },
          ],
          timeline: [
            {
              action: 'Complaint Registered',
              status: 'Submitted',
              performedBy: 'Citizen: Jane Citizen',
              note: '[Demo Record] Grievance submitted via CivicTrack online portal.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
            },
            {
              action: 'Department Assigned',
              status: 'In Progress',
              performedBy: 'Admin: State Grievance Administrator',
              note: 'Assigned to Water Supply & Sewerage Board. Priority marked High.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
            },
          ],
        },
        {
          trackingId: 'CT-2026-ROD411',
          citizenId: citizen._id,
          citizenName: 'Jane Citizen (Demo)',
          citizenEmail: citizen.email,
          citizenPhone: citizen.phone,
          category: 'Roads',
          title: '[Demonstration Record] Asphalt surface repair needed on High Street ramp',
          description:
            '[Demonstration Record for Portal Evaluation] Surface potholes reported along the access ramp to High Street Flyover.',
          location: {
            address: 'High Street Flyover Incline Ramp (Demo Area)',
            city: 'Metro City (Simulated)',
            landmark: 'Near Exit 12B',
            pincode: '98104',
          },
          priority: 'Emergency',
          assignedDepartment: 'Public Works Department (Roads & Bridges)',
          status: 'Submitted',
          remarks: [],
          timeline: [
            {
              action: 'Complaint Registered',
              status: 'Submitted',
              performedBy: 'Citizen: Jane Citizen',
              note: '[Demo Record] Grievance logged with emergency severity classification.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
            },
          ],
        },
        {
          trackingId: 'CT-2026-SAN104',
          citizenId: citizen._id,
          citizenName: 'Jane Citizen (Demo)',
          citizenEmail: citizen.email,
          citizenPhone: citizen.phone,
          category: 'Sanitation',
          title: '[Demonstration Record] Commercial district dumpster clearance required',
          description:
            '[Demonstration Record for Portal Evaluation] Public waste receptacle clearance requested at Market Square commercial zone.',
          location: {
            address: 'Corner of Pine Lane & Market Square (Demo Area)',
            city: 'Metro City (Simulated)',
            landmark: 'Behind Central Farmers Market',
            pincode: '98102',
          },
          priority: 'Medium',
          assignedDepartment: 'Solid Waste Management & Sanitation',
          status: 'Resolved',
          remarks: [
            {
              author: 'State Grievance Administrator',
              role: 'admin',
              comment:
                '[Official Officer Note] Zone compactor SQ-19 cleared waste backlog. Disinfection completed.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
            },
          ],
          timeline: [
            {
              action: 'Complaint Registered',
              status: 'Submitted',
              performedBy: 'Citizen: Jane Citizen',
              note: '[Demo Record] Complaint logged.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
            },
            {
              action: 'Department Assigned',
              status: 'In Progress',
              performedBy: 'Admin: State Grievance Administrator',
              note: 'Assigned to Solid Waste Management & Sanitation.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
            },
            {
              action: 'Resolved',
              status: 'Resolved',
              performedBy: 'Admin: State Grievance Administrator',
              note: 'Sanitation vehicle dispatched; waste cleared and daily collection schedule confirmed.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
            },
          ],
          resolutionNote:
            'Compactor vehicle cleared 2.4 tons of backlog. Daily collection route verified and inspection supervisor confirmed area cleared.',
          resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
      ];

      await Complaint.insertMany(demonstrationSamples);
      console.log(`[CivicTrack Seed] Seeded ${demonstrationSamples.length} demonstration grievance records.`);
    }
  } catch (err) {
    console.error('[CivicTrack Seed] Seeding error:', err);
  }
}
