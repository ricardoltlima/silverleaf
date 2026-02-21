package com.hoa.silverleaf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import com.hoa.silverleaf.users.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void residentsListWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/residents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void residentsListWithResidentRoleReturnsForbidden() throws Exception {
        createUser("resident1@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String residentToken = loginAndGetAccessToken("resident1@example.com", "Passw0rd!");

        mockMvc.perform(get("/api/v1/residents")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void residentsListSupportsPaginationAndSearchForAdmin() throws Exception {
        createUser("admin-search@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        createUser("ricardo@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("john@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String adminToken = loginAndGetAccessToken("admin-search@example.com", "Passw0rd!");

        mockMvc.perform(get("/api/v1/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "1")
                        .param("q", "ric"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value("ricardo@example.com"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void residentByIdNotFoundReturns404ForAdmin() throws Exception {
        createUser("admin1@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("admin1@example.com", "Passw0rd!");

        mockMvc.perform(get("/api/v1/residents/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Resident not found"));
    }

    @Test
    void publicOnboardingCanListPendingAndClaimHouse() throws Exception {
        createUser("admin-houses@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("admin-houses@example.com", "Passw0rd!");

        MvcResult createHouseResult = mockMvc.perform(post("/api/v1/houses")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "address": "123 Palm Street"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("UNKNOWN"))
                .andReturn();

        JsonNode houseJson = objectMapper.readTree(createHouseResult.getResponse().getContentAsString());
        String qrToken = houseJson.get("qrToken").asText();

        mockMvc.perform(get("/api/v1/public/onboarding/houses/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].address").value("123 Palm Street"));

        mockMvc.perform(get("/api/v1/public/onboarding/houses/" + qrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("123 Palm Street"));

        MvcResult startResult = mockMvc.perform(post("/api/v1/public/onboarding/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "houseId": %d
                                }
                                """.formatted(houseJson.get("id").asLong())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"))
                .andReturn();

        String sessionToken = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("sessionToken").asText();

        MvcResult contactResult = mockMvc.perform(post("/api/v1/public/onboarding/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "contactType": "EMAIL",
                                  "contactValue": "ricardo.lima@example.com"
                                }
                                """.formatted(sessionToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONTACT_PENDING"))
                .andReturn();

        String verificationToken = objectMapper.readTree(contactResult.getResponse().getContentAsString()).get("verificationToken").asText();

        mockMvc.perform(get("/api/v1/public/onboarding/verify/" + verificationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONTACT_VERIFIED"));

        mockMvc.perform(post("/api/v1/public/onboarding/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "provider": "google",
                                  "providerSubject": "google-123",
                                  "fullName": "Ricardo Lima",
                                  "email": "ricardo.lima@example.com"
                                }
                                """.formatted(sessionToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OCCUPIED"))
                .andExpect(jsonPath("$.residents.length()").value(1))
                .andExpect(jsonPath("$.residents[0].email").value("ricardo.lima@example.com"));

        mockMvc.perform(get("/api/v1/public/onboarding/houses/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        MvcResult startResult2 = mockMvc.perform(post("/api/v1/public/onboarding/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "houseId": %d
                                }
                                """.formatted(houseJson.get("id").asLong())))
                .andExpect(status().isOk())
                .andReturn();

        String sessionToken2 = objectMapper.readTree(startResult2.getResponse().getContentAsString()).get("sessionToken").asText();

        MvcResult contactResult2 = mockMvc.perform(post("/api/v1/public/onboarding/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "contactType": "EMAIL",
                                  "contactValue": "another@example.com"
                                }
                                """.formatted(sessionToken2)))
                .andExpect(status().isOk())
                .andReturn();

        String verificationToken2 = objectMapper.readTree(contactResult2.getResponse().getContentAsString()).get("verificationToken").asText();

        mockMvc.perform(get("/api/v1/public/onboarding/verify/" + verificationToken2))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/public/onboarding/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "provider": "google",
                                  "providerSubject": "google-456",
                                  "fullName": "Maria Lima",
                                  "email": "another@example.com"
                                }
                                """.formatted(sessionToken2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.residents.length()").value(2));

        mockMvc.perform(post("/api/v1/public/onboarding/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "provider": "google",
                                  "providerSubject": "google-duplicate",
                                  "fullName": "Duplicate Email",
                                  "email": "ricardo.lima@example.com"
                                }
                                """.formatted(sessionToken2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Onboarding session is not verified"));
    }

    @Test
    void authenticatedUserCanCreateFeedPostAndPaginate() throws Exception {
        createUser("feed.user@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String token = loginAndGetAccessToken("feed.user@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "First post from resident"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("First post from resident"));

        mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Second post with photo",
                                  "media": [
                                    { "type": "IMAGE", "url": "https://example.com/photo.jpg" }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.media.length()").value(1));

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + token)
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty());

        String nextCursor = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/feed")
                                .header("Authorization", "Bearer " + token)
                                .param("limit", "1"))
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        ).get("nextCursor").asText();

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + token)
                        .param("cursor", nextCursor)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void adminCanCreateReadUpdateDeactivateAndActivateResident() throws Exception {
        createUser("admin2@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("admin2@example.com", "Passw0rd!");

        MvcResult createResult = mockMvc.perform(post("/api/v1/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Ricardo Lima",
                                  "email": "ricardo.lima@example.com",
                                  "password": "Passw0rd!"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("RESIDENT"))
                .andExpect(jsonPath("$.enabled").value(true))
                .andReturn();

        JsonNode createdResident = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long residentId = createdResident.get("id").asLong();

        mockMvc.perform(get("/api/v1/residents/" + residentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ricardo.lima@example.com"));

        mockMvc.perform(get("/api/v1/residents")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/residents/" + residentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Ricardo Lima Updated",
                                  "email": "ricardo.updated@example.com",
                                  "password": "NewPassw0rd!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Ricardo Lima Updated"))
                .andExpect(jsonPath("$.email").value("ricardo.updated@example.com"));

        mockMvc.perform(patch("/api/v1/residents/" + residentId + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "ricardo.updated@example.com",
                                  "password": "NewPassw0rd!"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/residents/" + residentId + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));

        String residentTokenAfterActivation = loginAndGetAccessToken("ricardo.updated@example.com", "NewPassw0rd!");
        assertThat(residentTokenAfterActivation).isNotBlank();
    }

    private String loginAndGetAccessToken(String email, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return loginJson.get("accessToken").asText();
    }

    private void createUser(String email, String password, UserRole role, boolean enabled) {
        UserEntity user = new UserEntity();
        user.setFullName("Test User");
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(enabled);
        userRepository.save(user);
    }
}
