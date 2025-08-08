// H1_DEBUG: JWT Verification Test Script
const jwt = require('jsonwebtoken');

// Test token from console logs (HS256)
const testToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6InZqZFpIc0pTWFJoN1c0aGgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x3bmtqaHRpbGpzcHJldG94cnJ1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1NjM4NjdiZi0xMDY1LTQxZGItYmYwYy1mMzMzZjFmMDI0MWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU0Njc4Mjk2LCJpYXQiOjE3NTQ2NzQ2OTYsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxOYW1lIjoiVGVzdGVlIE1jVGVzdGVyIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1NjM4NjdiZi0xMDY1LTQxZGItYmYwYy1mMzMzZjFmMDI0MWQiLCJ1c2VybmFtZSI6InRlc3RAZXhhbXBsZS5jb20ifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1NDY3NDY5Nn1dLCJzZXNzaW9uX2lkIjoiY2RhYjM3Y2QtNjAyYS00Yjg4LWJjNDYtNThkZDkwYmY0ZjI4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.8V-vXm62As-dT_pUo-KJJ-THSlljtwBA42XOIuPjJVk";

const SUPABASE_JWT_SECRET = "tjeblT5WeN2CHzwh4CUFiovuPklmPkZYpt/G8KaRi9W6l5wIPrW7trJuLRbNJtu8yu/LEmcOssVlpHoJt/S1Tg==";

console.log("H1_DEBUG: [VALIDATION] Testing JWT verification methods...");

// Test 1: Decode header to confirm algorithm
try {
    const headerPart = testToken.split('.')[0];
    const decodedHeader = JSON.parse(Buffer.from(headerPart, 'base64').toString());
    console.log("H1_DEBUG: [HEADER] JWT Algorithm:", decodedHeader.alg);
    console.log("H1_DEBUG: [HEADER] Key ID:", decodedHeader.kid);
    console.log("H1_DEBUG: [HEADER] Expected: HS256 algorithm requiring symmetric key");
} catch (error) {
    console.error("H1_DEBUG: [ERROR] Failed to decode header:", error.message);
}

// Test 2: Symmetric verification with SUPABASE_JWT_SECRET
try {
    console.log("H1_DEBUG: [SYMMETRIC] Testing with SUPABASE_JWT_SECRET...");
    const decoded = jwt.verify(testToken, SUPABASE_JWT_SECRET);
    console.log("H1_DEBUG: [SYMMETRIC] ✅ SUCCESS - Token verified with symmetric key!");
    console.log("H1_DEBUG: [SYMMETRIC] User ID:", decoded.sub);
    console.log("H1_DEBUG: [SYMMETRIC] Email:", decoded.email);
} catch (error) {
    console.error("H1_DEBUG: [SYMMETRIC] ❌ FAILED:", error.message);
}

// Test 3: Check token expiration
try {
    const payloadPart = testToken.split('.')[1];
    const decodedPayload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExp = decodedPayload.exp;
    
    console.log("H1_DEBUG: [EXPIRATION] Current time:", currentTime);
    console.log("H1_DEBUG: [EXPIRATION] Token expires:", tokenExp);
    console.log("H1_DEBUG: [EXPIRATION] Token expired:", currentTime > tokenExp);
    
    if (currentTime > tokenExp) {
        console.log("H1_DEBUG: [EXPIRATION] ⚠️  Token is expired - this could contribute to failures");
    } else {
        console.log("H1_DEBUG: [EXPIRATION] ✅ Token is still valid");
    }
} catch (error) {
    console.error("H1_DEBUG: [EXPIRATION] Failed to check expiration:", error.message);
}

console.log("H1_DEBUG: [CONCLUSION] If symmetric verification succeeds but JWKS fails,");
console.log("H1_DEBUG: [CONCLUSION] this confirms HS256/JWKS mismatch hypothesis!");
