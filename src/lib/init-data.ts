import { supabase } from './supabase';

// Initialize sample data for first-time users
export async function initializeData() {
  try {
    console.log('Initializing sample data...');

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'admin')
      .single();

    if (existingAdmin) {
      console.log('Data already initialized');
      return { success: true, message: 'Data already exists' };
    }

    // Create admin user
    const adminUser = {
      id: 'admin',
      email: 'admin@system',
      name: 'Admin',
      password: 'Omkar@123',
      created_at: new Date().toISOString()
    };

    const { error: userError } = await supabase
      .from('users')
      .insert([adminUser]);

    if (userError) {
      console.error('Error creating admin user:', userError);
      throw userError;
    }

    // Create initial activity
    const initialActivity = {
      id: Date.now().toString(),
      user_id: 'admin',
      activity: 'System Initialized',
      details: {
        message: 'System started successfully with Supabase integration'
      },
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    const { error: activityError } = await supabase
      .from('activities')
      .insert([initialActivity]);

    if (activityError) {
      console.error('Error creating initial activity:', activityError);
      // Don't throw here, admin user creation is more important
    }

    console.log('Sample data initialized successfully');
    return { success: true, message: 'Sample data initialized' };

  } catch (error) {
    console.error('Failed to initialize data:', error);
    return { success: false, message: `Initialization failed: ${error}` };
  }
}

// Check if Supabase is available and working
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('Supabase connection failed:', error.message);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.log('Supabase not available:', error);
    return false;
  }
}
