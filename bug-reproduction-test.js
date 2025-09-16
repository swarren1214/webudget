// Minimal reproduction test for the Plaid Link bug
// This demonstrates the issue without full app setup

function demonstrateBug() {
  // Simulate the state initialization
  let selectedAccountId = null; // This is never changed!
  
  // Simulate the handleConnectAccount function
  function handleConnectAccount() {
    // Notice: No account creation here!
    // Just directly opens Plaid (simulated)
    simulatePlaidSuccess();
  }
  
  // Simulate Plaid onSuccess callback
  function simulatePlaidSuccess() {
    try {
      if (selectedAccountId === null) {
        throw new Error("No account selected.");
      }
      console.log("This line never executes");
    } catch (error) {
      console.error("Failed to exchange Plaid public token:", error);
      return error.message;
    }
  }
  
  // Execute the bug
  console.log("Starting reproduction...");
  handleConnectAccount();
}

// Run the test
demonstrateBug();

// Expected output: "Failed to exchange Plaid public token: Error: No account selected."
