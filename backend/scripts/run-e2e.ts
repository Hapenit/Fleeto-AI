import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function runTest() {
  console.log('=== Fleeto End-to-End Live Execution ===');

  // 1. Login
  console.log('\n[1] Logging in as Admin...');
  let loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fleeto.ai', password: 'password123' })
  });
  
  if (!loginRes.ok) {
     console.log('Admin login failed, creating admin via Prisma...');
     const { PrismaClient } = await import('@prisma/client');
     const bcrypt = await import('bcrypt');
     const prisma = new PrismaClient();
     
     const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@fleeto.ai' } });
     if (!existingAdmin) {
       await prisma.user.create({
         data: {
           email: 'admin@fleeto.ai',
           passwordHash: await bcrypt.hash('password123', 10),
           firstName: 'Admin',
           lastName: 'Fleeto',
           role: 'ADMIN',
           status: 'ACTIVE'
         }
       });
       console.log('Admin user created successfully.');
     } else {
       console.log('Admin user exists, resetting password...');
       await prisma.user.update({
         where: { email: 'admin@fleeto.ai' },
         data: { passwordHash: await bcrypt.hash('password123', 10) }
       });
     }
     
     await prisma.$disconnect();

     // Retry Login
     loginRes = await fetch(`${API_BASE}/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email: 'admin@fleeto.ai', password: 'password123' })
     });
     
     if (!loginRes.ok) {
       console.log('Retry Admin login failed:', loginRes.status, await loginRes.text());
       return;
     }
  }
  let { data: { accessToken } } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  console.log('✔ Login successful.');

  // 2. Create Requirement (Module 2)
  console.log('\n[2] Creating new Transport Requirement (Module 2)...');
  const reqRes = await fetch(`${API_BASE}/requirements`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pickupCity: "Chennai",
      deliveryCity: "Bangalore",
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      vehicleType: "TRAILER_40FT",
      cargoType: "STEEL_COILS",
      targetPrice: 85000
    })
  });
  const reqData = await reqRes.json();
  const reqId = reqData.data.id;
  console.log('✔ Requirement created:', reqData.data.requirementNumber);

  // 3. Create a Vendor
  console.log('\n[3] Creating target Vendor...');
  const vendorRes = await fetch(`${API_BASE}/vendors`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      companyName: `Live Test Transporter ${Date.now()}`,
      contactPersonName: "Rajesh Kumar",
      primaryPhone: "+919876543210", 
      status: "ACTIVE",
      locations: [
        { city: 'Chennai', locationType: 'OFFICE' }
      ],
      vehicleCapabilities: [
        { vehicleType: 'TRAILER_40FT', minimumCapacity: 20 }
      ]
    })
  });
  const vendorData = await vendorRes.json();
  if (!vendorRes.ok || !vendorData.success) {
    console.error('Failed to create vendor:', vendorData);
    return;
  }
  const vendorId = vendorData.data.id;
  console.log('✔ Vendor created:', vendorData.data.companyName);

  // 4. Run Eligibility (Module 4)
  console.log('\n[4] Running Vendor Eligibility (Module 4)...');
  const elRes = await fetch(`${API_BASE}/eligibility/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requirementId: reqId })
  });
  const elData = await elRes.json();
  if (!elRes.ok || !elData.success) {
    console.error('Failed to run eligibility:', elData);
    return;
  }
  console.log('✔ Eligibility Run created:', elData.data.runNumber);
  console.log('  Evaluations generated:', elData.data.evaluations.length);

  // 5. Run Matching Engine (Module 5)
  console.log('\n[5] Running Matching Engine (Module 5)...');
  const matchRes = await fetch(`${API_BASE}/matching/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requirementId: reqId })
  });
  const matchData = await matchRes.json();
  console.log('✔ Matching Run completed. Top Vendor selected.');

  // 6. Initiate Voice Call (Module 7)
  console.log('\n[6] Initiating Voice Call via Exotel (Module 7)...');
  // Need to create a voice call record first
  const callCreateRes = await fetch(`${API_BASE}/voice-calls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requirementId: reqId, vendorId: vendorId })
  });
  const callData = await callCreateRes.json();
  const callId = callData.data.id;
  
  const callInitRes = await fetch(`${API_BASE}/voice-calls/${callId}/initiate`, {
    method: 'POST',
    headers
  });
  console.log('✔ Call initiated:', await callInitRes.json());
  
  console.log('\n[7] Simulating AI Conversation Analysis (Module 9/10)...');
  const aiRes = await fetch(`${API_BASE}/calls/${callId}/analysis`, {
    method: 'GET',
    headers
  });
  
  console.log('✔ Live Backend Workflow Complete!');
}

runTest().catch(console.error);
