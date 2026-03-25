/**
 * Sample Voter Data Seeding Script
 * Run: node seeds/seed-voters.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Voter = require('../models/Voter');
const { connectDB } = require('../models/db-connection');

const sampleVoters = [
  {
    voterId: 'V001',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '9876543210',
    constituency: 'North District',
    boothId: 'B001',
    age: 45,
    gender: 'M',
    address: '123 Main Street',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V002',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '9876543211',
    constituency: 'North District',
    boothId: 'B001',
    age: 38,
    gender: 'F',
    address: '456 Oak Avenue',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V003',
    name: 'Amit Patel',
    email: 'amit@example.com',
    phone: '9876543212',
    constituency: 'Central District',
    boothId: 'B002',
    age: 52,
    gender: 'M',
    address: '789 Elm Road',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V004',
    name: 'Neha Gupta',
    email: 'neha@example.com',
    phone: '9876543213',
    constituency: 'Central District',
    boothId: 'B002',
    age: 41,
    gender: 'F',
    address: '321 Pine Street',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V005',
    name: 'Suresh Sharma',
    email: 'suresh@example.com',
    phone: '9876543214',
    constituency: 'South District',
    boothId: 'B003',
    age: 55,
    gender: 'M',
    address: '654 Maple Drive',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V006',
    name: 'Anjali Verma',
    email: 'anjali@example.com',
    phone: '9876543215',
    constituency: 'South District',
    boothId: 'B003',
    age: 36,
    gender: 'F',
    address: '987 Cedar Lane',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V007',
    name: 'Vikram Reddy',
    email: 'vikram@example.com',
    phone: '9876543216',
    constituency: 'East District',
    boothId: 'B004',
    age: 48,
    gender: 'M',
    address: '147 Birch Court',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V008',
    name: 'Divya Iyer',
    email: 'divya@example.com',
    phone: '9876543217',
    constituency: 'East District',
    boothId: 'B004',
    age: 43,
    gender: 'F',
    address: '258 Spruce Way',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V009',
    name: 'Arjun Nair',
    email: 'arjun@example.com',
    phone: '9876543218',
    constituency: 'West District',
    boothId: 'B005',
    age: 39,
    gender: 'M',
    address: '369 Walnut Path',
    hasVoted: false,
    status: 'registered'
  },
  {
    voterId: 'V010',
    name: 'Kavya Menon',
    email: 'kavya@example.com',
    phone: '9876543219',
    constituency: 'West District',
    boothId: 'B005',
    age: 34,
    gender: 'F',
    address: '741 Chestnut Circle',
    hasVoted: false,
    status: 'registered'
  }
];

async function seedVoters() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    console.log('Clearing existing voters...');
    await Voter.deleteMany({});

    console.log('Seeding voters...');
    await Voter.insertMany(sampleVoters);

    console.log('✓ Successfully seeded 10 sample voters');
    console.log('\nSample voters created:');
    sampleVoters.forEach(voter => {
      console.log(`  - ${voter.voterId}: ${voter.name} (${voter.boothId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding voters:', error);
    process.exit(1);
  }
}

seedVoters();
