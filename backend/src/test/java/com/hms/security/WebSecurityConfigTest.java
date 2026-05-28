package com.hms.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class WebSecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void publicAuthEndpointsPermitted() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"username\":\"invalid\",\"password\":\"invalid\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    public void billingEndpointsUnauthorizedForAnonymous() throws Exception {
        mockMvc.perform(get("/api/billings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patient_user", roles = "PATIENT")
    public void billingEndpointsForbiddenForPatientRole() throws Exception {
        mockMvc.perform(get("/api/billings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    public void billingEndpointsAllowedForAdminRole() throws Exception {
        mockMvc.perform(get("/api/billings"))
                .andExpect(status().isOk());
    }

    @Test
    public void shiftEndpointsUnauthorizedForAnonymous() throws Exception {
        mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patient_user", roles = "PATIENT")
    public void shiftEndpointsForbiddenForPatientRole() throws Exception {
        mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "doctor_user", roles = "DOCTOR")
    public void shiftEndpointsAllowedForDoctorRole() throws Exception {
        mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isOk());
    }
}
