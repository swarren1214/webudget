// H2_DEBUG: JWKS Endpoint Test Script
const https = require('https');

const JWKS_URL = 'https://lwnkjhtiljspretoxrru.supabase.co/auth/v1/keys';

console.log("H2_DEBUG: [JWKS_TEST] Testing JWKS endpoint accessibility...");
console.log("H2_DEBUG: [JWKS_URL]", JWKS_URL);

https.get(JWKS_URL, (res) => {
    let data = '';
    
    console.log("H2_DEBUG: [HTTP_STATUS]", res.statusCode);
    console.log("H2_DEBUG: [HTTP_HEADERS]", res.headers);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error("H2_DEBUG: [HTTP_ERROR] ❌ JWKS endpoint returned status:", res.statusCode);
            console.log("H2_DEBUG: [ERROR_RESPONSE]", data);
            return;
        }
        
        try {
            const jwks = JSON.parse(data);
            console.log("H2_DEBUG: [JWKS_RESPONSE] ✅ JWKS endpoint accessible");
            console.log("H2_DEBUG: [JWKS_KEYS] Number of keys:", jwks.keys?.length || 0);
            
            if (jwks.keys && jwks.keys.length > 0) {
                jwks.keys.forEach((key, index) => {
                    console.log(`H2_DEBUG: [KEY_${index}] Algorithm:`, key.alg);
                    console.log(`H2_DEBUG: [KEY_${index}] Key Type:`, key.kty);
                    console.log(`H2_DEBUG: [KEY_${index}] Key ID:`, key.kid);
                    console.log(`H2_DEBUG: [KEY_${index}] Use:`, key.use);
                });
                
                // Check if the expected kid exists
                const expectedKid = "vjdZHsJSXRh7W4hh";
                const matchingKey = jwks.keys.find(key => key.kid === expectedKid);
                
                if (matchingKey) {
                    console.log("H2_DEBUG: [KEY_MATCH] ✅ Found matching key for kid:", expectedKid);
                    console.log("H2_DEBUG: [KEY_MATCH] Algorithm:", matchingKey.alg);
                } else {
                    console.log("H2_DEBUG: [KEY_MATCH] ❌ No matching key found for kid:", expectedKid);
                    console.log("H2_DEBUG: [KEY_MATCH] Available kids:", jwks.keys.map(k => k.kid));
                }
                
                // Check for HS256 support
                const hs256Keys = jwks.keys.filter(key => key.alg === 'HS256');
                if (hs256Keys.length > 0) {
                    console.log("H2_DEBUG: [HS256_CHECK] ✅ JWKS contains HS256 keys");
                } else {
                    console.log("H2_DEBUG: [HS256_CHECK] ❌ JWKS contains no HS256 keys");
                    console.log("H2_DEBUG: [HS256_CHECK] Algorithms found:", jwks.keys.map(k => k.alg));
                }
            } else {
                console.log("H2_DEBUG: [JWKS_KEYS] ❌ No keys found in JWKS");
            }
        } catch (parseError) {
            console.error("H2_DEBUG: [PARSE_ERROR] Failed to parse JWKS response:", parseError.message);
            console.log("H2_DEBUG: [RAW_RESPONSE]", data);
        }
    });
}).on('error', (error) => {
    console.error("H2_DEBUG: [CONNECTION_ERROR] ❌ Failed to connect to JWKS endpoint:", error.message);
    console.log("H2_DEBUG: [CONNECTION_ERROR] This could indicate network issues or endpoint problems");
});
