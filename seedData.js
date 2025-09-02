const mongoose = require('mongoose');
const Project = require('./models/Project');
const Task = require('./models/Task');
require('dotenv').config();

// Sample data
const sampleProjects = [
  {
    name: 'Website Redesign',
    client: 'TechCorp Inc',
    description: 'Complete website redesign with modern UI/UX',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    deadline: new Date('2024-06-15'),
    progress: 45,
    status: 'active',
    budget: 50000,
    priority: 'high'
  },
  {
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    description: 'Cross-platform mobile application development',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-31'),
    deadline: new Date('2024-08-15'),
    progress: 25,
    status: 'active',
    budget: 75000,
    priority: 'high'
  },
  {
    name: 'Marketing Campaign',
    client: 'RetailCorp',
    description: 'Digital marketing campaign for product launch',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    deadline: new Date('2024-05-15'),
    progress: 70,
    status: 'active',
    budget: 25000,
    priority: 'medium'
  },
  {
    name: 'Internal Training',
    client: 'Internal',
    description: 'Employee training and development program',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    deadline: new Date('2024-12-15'),
    progress: 30,
    status: 'active',
    budget: 15000,
    priority: 'low'
  }
];

const sampleTasks = [
  {
    name: 'Frontend Development',
    description: 'Develop user interface components',
    priority: 'high',
    status: 'in-progress',
    estimatedHours: 40,
    actualHours: 15,
    tags: ['frontend', 'react', 'ui']
  },
  {
    name: 'Backend API Development',
    description: 'Create REST API endpoints',
    priority: 'high',
    status: 'todo',
    estimatedHours: 30,
    actualHours: 0,
    tags: ['backend', 'api', 'nodejs']
  },
  {
    name: 'Database Design',
    description: 'Design and implement database schema',
    priority: 'medium',
    status: 'completed',
    estimatedHours: 20,
    actualHours: 18,
    tags: ['database', 'mongodb']
  },
  {
    name: 'UI/UX Design',
    description: 'Create user interface designs and mockups',
    priority: 'medium',
    status: 'in-progress',
    estimatedHours: 25,
    actualHours: 10,
    tags: ['design', 'ui', 'ux']
  },
  {
    name: 'Testing & QA',
    description: 'Quality assurance and testing',
    priority: 'medium',
    status: 'todo',
    estimatedHours: 15,
    actualHours: 0,
    tags: ['testing', 'qa']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Insert projects
    const createdProjects = await Project.insertMany(sampleProjects);
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Create tasks for each project
    const tasksToCreate = [];
    createdProjects.forEach(project => {
      sampleTasks.forEach(taskTemplate => {
        tasksToCreate.push({
          ...taskTemplate,
          project: project._id
        });
      });
    });

    const createdTasks = await Task.insertMany(tasksToCreate);
    console.log(`✅ Created ${createdTasks.length} tasks`);

    console.log('🎉 Database seeded successfully!');
    
    // Display created data
    console.log('\n📋 Created Projects:');
    createdProjects.forEach(p => {
      console.log(`- ${p.name} (${p.client}) - ID: ${p._id}`);
    });
    
    console.log('\n📋 Created Tasks:');
    createdTasks.slice(0, 5).forEach(t => {
      console.log(`- ${t.name} - Project: ${t.project}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedDatabase();
