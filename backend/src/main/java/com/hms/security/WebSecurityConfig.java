package com.hms.security;

import com.hms.security.jwt.AuthTokenFilter;
import com.hms.security.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.http.HttpMethod;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // WebSocket endpoints
                .requestMatchers("/ws/**").permitAll()
                // H2 console (dev only)
                .requestMatchers("/h2-console/**").permitAll()
                // Admin-only endpoints (Plural billing routes secured)
                .requestMatchers("/api/billings/patient/**").hasAnyRole("ADMIN", "PATIENT")
                .requestMatchers("/api/billings/*/receipt").hasAnyRole("ADMIN", "PATIENT")
                .requestMatchers("/api/billings/*/payment-status").hasAnyRole("ADMIN", "PATIENT")
                .requestMatchers(HttpMethod.GET, "/api/billings/*").hasAnyRole("ADMIN", "PATIENT")
                .requestMatchers("/api/billings/**").hasRole("ADMIN")
                // Analytics
                .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "DOCTOR")
                // Doctor and Admin
                .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "DOCTOR")
                // Doctor, Admin (patient management)
                .requestMatchers("/api/doctors/**").hasAnyRole("ADMIN", "DOCTOR")
                .requestMatchers("/api/patients/**").hasAnyRole("ADMIN", "DOCTOR")
                // Shifts (Admin and Doctor)
                .requestMatchers("/api/shifts/**").hasAnyRole("ADMIN", "DOCTOR")
                // Medical Records (Patients can read their own records, Doctors/Admins manage them)
                .requestMatchers("/api/medical-records/patient/**").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                .requestMatchers(HttpMethod.GET, "/api/medical-records/*").hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                .requestMatchers("/api/medical-records/**").hasAnyRole("ADMIN", "DOCTOR")
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        // Allow H2 console frames in dev
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }
}
