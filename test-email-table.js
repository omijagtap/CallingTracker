// Test script to verify email_activities table connection
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials (update these)
const supabaseUrl = 'https://mkmuhctmddhttosgcpmo.supabase.co';
const supabaseKey = 'your-anon-key-here'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailActivitiesTable() {
  console.log('🧪 Testing email_activities table connection...');
  
  try {
    // Test 1: Check if table exists
    console.log('1️⃣ Checking if table exists...');
    const { data: existingData, error: selectError } = await supabase
      .from('email_activities')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Table does not exist or is not accessible:', selectError.message);
      console.log('📋 Please run the SQL code provided to create the table');
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Test 2: Insert a test record
    console.log('2️⃣ Testing insert...');
    const testRecord = {
      id: `test_${Date.now()}`,
      user_id: 'test_user',
      user_email: 'test@example.com',
      recipient_email: 'recipient@example.com',
      subject: 'Test Email',
      message: 'This is a test email',
      status: 'sent',
      sent_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('email_activities')
      .insert([testRecord])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return;
    }
    
    console.log('✅ Insert successful:', insertData);
    
    // Test 3: Query the data
    console.log('3️⃣ Testing query...');
    const { data: queryData, error: queryError } = await supabase
      .from('email_activities')
      .select('*')
      .eq('user_id', 'test_user')
      .order('sent_at', { ascending: false });
    
    if (queryError) {
      console.error('❌ Query failed:', queryError.message);
      return;
    }
    
    console.log('✅ Query successful, found records:', queryData.length);
    
    // Test 4: Clean up test data
    console.log('4️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('email_activities')
      .delete()
      .eq('user_id', 'test_user');
    
    if (deleteError) {
      console.warn('⚠️ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Cleanup successful');
    }
    
    console.log('🎉 All tests passed! Email activities table is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailActivitiesTable();
