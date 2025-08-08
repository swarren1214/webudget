const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lwnkjhtiljspretoxrru.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bmtqaHRpbGpzcHJldG94cnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzczOTEsImV4cCI6MjA2NzA1MzM5MX0.3y7pT_YysdoK8a_1vGSSecxYGorhM28kTSJ-79IWDDM'
);

console.log('H1_VALIDATION: Testing table existence...');
Promise.all([
  supabase.from('institutions').select('*').limit(1),
  supabase.from('plaid_items').select('*').limit(1)
]).then(([institutionsResult, plaidItemsResult]) => {
  console.log('H1_RESULT [institutions]:', institutionsResult.error?.message || 'SUCCESS - table exists');
  console.log('H1_RESULT [plaid_items]:', plaidItemsResult.error?.message || 'SUCCESS - table exists');
  
  if (institutionsResult.error && plaidItemsResult.error) {
    console.log('H1_CONCLUSION: Both tables missing - different issue');
  } else if (institutionsResult.error && !plaidItemsResult.error) {
    console.log('H1_CONCLUSION: ✅ HYPOTHESIS CONFIRMED - institutions table missing, plaid_items exists');
  } else if (!institutionsResult.error && plaidItemsResult.error) {
    console.log('H1_CONCLUSION: Schema updated - institutions exists, plaid_items missing');  
  } else {
    console.log('H1_CONCLUSION: Both tables exist - different issue');
  }
}).catch(console.error);
