package com.procurement.procurement.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // expiration from properties
    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    // secret from properties
    @Value("${jwt.secret:MyJwtSecretKey1234567890MyJwtSecretKey1234567890}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        String secret = jwtSecret == null ? "" : jwtSecret.trim();

        // Allow either Base64-encoded secrets or plain text secrets.
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            if (keyBytes.length >= 32) {
                return Keys.hmacShaKeyFor(keyBytes);
            }
        } catch (Exception ignored) {
            // Fall through and treat value as plain text.
        }

        byte[] plainBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (plainBytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes for HS256.");
        }
        return Keys.hmacShaKeyFor(plainBytes);
    }

    // generate jwt token
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // generate vendor jwt token
    public String generateVendorToken(String email, Long vendorId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("vendorId", vendorId)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // get username from jwt
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // get vendor id from jwt
    public Long getVendorIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("vendorId", Long.class);
    }

    // validate jwt
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // print validation error
            System.err.println("JWT Validation Error: " + ex.getMessage());
        }
        return false;
    }
}