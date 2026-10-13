package com.hardwareshop.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hardwareshop.dto.request.LoginRequest;
import com.hardwareshop.dto.response.AuthResponse;
import com.hardwareshop.entity.Role;
import com.hardwareshop.repository.UserRepository;
import com.hardwareshop.security.CustomUserDetailsService;
import com.hardwareshop.security.JwtAuthenticationEntryPoint;
import com.hardwareshop.security.JwtTokenProvider;
import com.hardwareshop.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Test
    @DisplayName("POST /api/auth/login should return 200 with JWT on valid credentials")
    void testSuccessfulLogin() throws Exception {
        LoginRequest req = new LoginRequest("admin", "Admin@123");
        AuthResponse authRes = new AuthResponse("mock-jwt-token", "admin", "admin@hardwareshop.local", "Admin User", Role.ROLE_ADMIN);

        when(authService.login(any(LoginRequest.class))).thenReturn(authRes);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.data.username").value("admin"))
                .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 401 on bad credentials")
    void testFailedLogin() throws Exception {
        LoginRequest req = new LoginRequest("admin", "WrongPassword");

        when(authService.login(any(LoginRequest.class))).thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }
}
