package com.hoa.silverleaf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.community.CommunityRepository;
import com.hoa.silverleaf.community.ResidentCommunityMembershipRepository;
import com.hoa.silverleaf.community.ResidentCommunityMembershipService;
import com.hoa.silverleaf.community.CommunityService;
import com.hoa.silverleaf.houses.HouseEntity;
import com.hoa.silverleaf.houses.HouseRepository;
import com.hoa.silverleaf.houses.HouseResidentEntity;
import com.hoa.silverleaf.houses.HouseResidentRepository;
import com.hoa.silverleaf.houses.HouseStatus;
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
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

    @Autowired
    private HouseRepository houseRepository;

    @Autowired
    private HouseResidentRepository houseResidentRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private ResidentCommunityMembershipRepository residentCommunityMembershipRepository;

    @Autowired
    private ResidentCommunityMembershipService residentCommunityMembershipService;

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

        UserEntity onboardedUser = userRepository.findByEmailIgnoreCase("ricardo.lima@example.com").orElse(null);
        assertThat(onboardedUser).isNotNull();
        assertThat(onboardedUser.getRole()).isEqualTo(UserRole.RESIDENT);

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
    void houseCreationAssignsSeededDefaultCommunity() throws Exception {
        createUser("admin.community@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("admin.community@example.com", "Passw0rd!");

        assertThat(communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG)).isPresent();

        MvcResult createHouseResult = mockMvc.perform(post("/api/v1/houses")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "address": "901 Banyan Way"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.address").value("901 Banyan Way"))
                .andReturn();

        long houseId = objectMapper.readTree(createHouseResult.getResponse().getContentAsString()).get("id").asLong();
        HouseEntity savedHouse = houseRepository.findById(houseId).orElseThrow();

        assertThat(savedHouse.getCommunity()).isNotNull();
        assertThat(savedHouse.getCommunity().getSlug()).isEqualTo(CommunityService.DEFAULT_COMMUNITY_SLUG);
        assertThat(savedHouse.getCommunity().getName()).isEqualTo("Silverleaf Reserve");
    }

    @Test
    void authRegisterCreatesDefaultCommunityMembership() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Registered Resident",
                                  "email": "registered.membership@example.com",
                                  "password": "Passw0rd!"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        UserEntity registeredUser = userRepository.findByEmailIgnoreCase("registered.membership@example.com").orElseThrow();
        assertThat(residentCommunityMembershipRepository
                .findFirstByResidentIdAndActiveTrueOrderByUpdatedAtDescIdDesc(registeredUser.getId()))
                .isPresent()
                .get()
                .extracting(membership -> membership.getCommunity().getSlug())
                .isEqualTo(CommunityService.DEFAULT_COMMUNITY_SLUG);
    }

    @Test
    void residentWithCommunityAdminMembershipCanAccessCommunityAdminEndpoints() throws Exception {
        createUser("community.admin.member@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        UserEntity resident = userRepository.findByEmailIgnoreCase("community.admin.member@example.com").orElseThrow();
        CommunityEntity defaultCommunity = communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow();
        residentCommunityMembershipService.syncCommunityAdmin(resident, defaultCommunity, true);

        String token = loginAndGetAccessToken("community.admin.member@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/board/news")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Community Admin Update",
                                  "body": "Membership-based admin access works",
                                  "mediaUrls": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Community Admin Update"));
    }

    @Test
    void communityAdminCanPromoteAnotherResidentToCommunityAdmin() throws Exception {
        createUser("promoter@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("promoted@example.com", "Passw0rd!", UserRole.RESIDENT, true);

        UserEntity promoter = userRepository.findByEmailIgnoreCase("promoter@example.com").orElseThrow();
        UserEntity promoted = userRepository.findByEmailIgnoreCase("promoted@example.com").orElseThrow();
        CommunityEntity defaultCommunity = communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow();
        residentCommunityMembershipService.syncCommunityAdmin(promoter, defaultCommunity, true);

        String promoterToken = loginAndGetAccessToken("promoter@example.com", "Passw0rd!");

        mockMvc.perform(put("/api/v1/residents/" + promoted.getId())
                        .header("Authorization", "Bearer " + promoterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Promoted Resident",
                                  "email": "promoted@example.com",
                                  "password": null,
                                  "role": "RESIDENT",
                                  "communityAdmin": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.communityAdmin").value(true));

        String promotedToken = loginAndGetAccessToken("promoted@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/board/news")
                        .header("Authorization", "Bearer " + promotedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Promoted Access",
                                  "body": "This resident was explicitly promoted",
                                  "mediaUrls": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Promoted Access"));
    }

    @Test
    void invalidGroupVisibilityReturnsBadRequest() throws Exception {
        createUser("group.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String token = loginAndGetAccessToken("group.owner@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Broken Visibility Group",
                                  "description": "Should fail validation",
                                  "visibility": "PUBLC"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void clearingFeedReactionReturnsNullViewerReaction() throws Exception {
        createUser("feed.reaction@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String token = loginAndGetAccessToken("feed.reaction@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Reaction nullability check",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/likes")
                        .header("Authorization", "Bearer " + token)
                        .param("reaction", "HEART"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewerReaction").value("HEART"));

        mockMvc.perform(delete("/api/v1/feed/posts/" + postId + "/likes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewerReaction").value(nullValue()));
    }

    @Test
    void positivePostReactionsCreateAlertsForPostAuthor() throws Exception {
        createUser("reaction.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("reaction.actor@example.com", "Passw0rd!", UserRole.RESIDENT, true);

        String ownerToken = loginAndGetAccessToken("reaction.owner@example.com", "Passw0rd!");
        String actorToken = loginAndGetAccessToken("reaction.actor@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Post that should receive a reaction alert",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/likes")
                        .header("Authorization", "Bearer " + actorToken)
                        .param("reaction", "OK"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/alerts/reactions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/likes")
                        .header("Authorization", "Bearer " + actorToken)
                        .param("reaction", "CLAP"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/alerts/reactions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].postId").value(postId))
                .andExpect(jsonPath("$[0].actorName").value("Test User"))
                .andExpect(jsonPath("$[0].reactionType").value("CLAP"))
                .andExpect(jsonPath("$[0].channel").value("COMMUNITY"))
                .andExpect(jsonPath("$[0].unread").value(true));

        mockMvc.perform(post("/api/v1/alerts/reactions/read-all")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/alerts/reactions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unread").value(false));
    }

    @Test
    void reportedPostsAppearInHoaQueueAndCanBeDeleted() throws Exception {
        createUser("reports.admin@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        createUser("reports.author@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("reports.viewer@example.com", "Passw0rd!", UserRole.RESIDENT, true);

        String adminToken = loginAndGetAccessToken("reports.admin@example.com", "Passw0rd!");
        String authorToken = loginAndGetAccessToken("reports.author@example.com", "Passw0rd!");
        String viewerToken = loginAndGetAccessToken("reports.viewer@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Post that should be reported",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/reports")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/feed/reports")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].postId").value(postId))
                .andExpect(jsonPath("$[0].authorName").value("Test User"))
                .andExpect(jsonPath("$[0].reportCount").value(1))
                .andExpect(jsonPath("$[0].reporterNames[0]").value("Test User"));

        mockMvc.perform(delete("/api/v1/feed/reports/posts/" + postId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/feed/reports")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void reportedCommentsAppearInHoaQueueAndCanBeDeleted() throws Exception {
        createUser("comment.reports.admin@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        createUser("comment.reports.author@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("comment.reports.viewer@example.com", "Passw0rd!", UserRole.RESIDENT, true);

        String adminToken = loginAndGetAccessToken("comment.reports.admin@example.com", "Passw0rd!");
        String authorToken = loginAndGetAccessToken("comment.reports.author@example.com", "Passw0rd!");
        String viewerToken = loginAndGetAccessToken("comment.reports.viewer@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Post with a reported comment",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        MvcResult createdCommentResult = mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "This comment should be reviewed"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long commentId = objectMapper.readTree(createdCommentResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/comments/" + commentId + "/reports")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/feed/reports")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].targetType").value("COMMENT"))
                .andExpect(jsonPath("$[0].postId").value(postId))
                .andExpect(jsonPath("$[0].commentId").value(commentId))
                .andExpect(jsonPath("$[0].bodyText").value("This comment should be reviewed"));

        mockMvc.perform(delete("/api/v1/feed/reports/comments/" + commentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/feed/reports")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void communityAdminCanEditAndDeleteFeedContentDirectly() throws Exception {
        createUser("feed.admin@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("feed.author@example.com", "Passw0rd!", UserRole.RESIDENT, true);

        UserEntity adminUser = userRepository.findByEmailIgnoreCase("feed.admin@example.com").orElseThrow();
        CommunityEntity defaultCommunity = communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow();
        residentCommunityMembershipService.syncCommunityAdmin(adminUser, defaultCommunity, true);

        String adminToken = loginAndGetAccessToken("feed.admin@example.com", "Passw0rd!");
        String authorToken = loginAndGetAccessToken("feed.author@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Original post text",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        MvcResult createdCommentResult = mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Original comment text"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long commentId = objectMapper.readTree(createdCommentResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(put("/api/v1/feed/posts/" + postId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Updated by community admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated by community admin"));

        mockMvc.perform(put("/api/v1/feed/posts/" + postId + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Updated comment by community admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated comment by community admin"));

        mockMvc.perform(delete("/api/v1/feed/posts/" + postId + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("This comment was deleted by HOA"));

        mockMvc.perform(delete("/api/v1/feed/posts/" + postId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("channel", "COMMUNITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void userCanSwitchActiveCommunityAndReceiveNewSessionContext() throws Exception {
        createUser("switcher@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        CommunityEntity otherCommunity = createCommunity("cedar-glen", "Cedar Glen");
        residentCommunityMembershipService.activateMembership(
                userRepository.findByEmailIgnoreCase("switcher@example.com").orElseThrow(),
                otherCommunity
        );

        JsonNode loginJson = loginAndGetAuth("switcher@example.com", "Passw0rd!");
        String accessToken = loginJson.get("accessToken").asText();
        String refreshToken = loginJson.get("refreshToken").asText();

        MvcResult switchResult = mockMvc.perform(post("/api/v1/auth/switch-community")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "communityId": %d,
                                  "refreshToken": "%s"
                                }
                                """.formatted(otherCommunity.getId(), refreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCommunityId").value(otherCommunity.getId()))
                .andExpect(jsonPath("$.activeCommunitySlug").value("cedar-glen"))
                .andExpect(jsonPath("$.activeCommunityName").value("Cedar Glen"))
                .andReturn();

        JsonNode switchedJson = objectMapper.readTree(switchResult.getResponse().getContentAsString());
        String switchedAccessToken = switchedJson.get("accessToken").asText();

        mockMvc.perform(post("/api/v1/auth/switch-community")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "communityId": %d,
                                  "refreshToken": "%s"
                                }
                                """.formatted(communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow().getId(), refreshToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));

        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer " + switchedAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCommunityId").value(otherCommunity.getId()))
                .andExpect(jsonPath("$.activeCommunitySlug").value("cedar-glen"))
                .andExpect(jsonPath("$.activeCommunityName").value("Cedar Glen"));
    }

    @Test
    void hoaAdminCannotUseCommunityAdminEndpointsAfterSwitchingToNonAdminCommunity() throws Exception {
        createUser("scoped.hoa.admin@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        UserEntity admin = userRepository.findByEmailIgnoreCase("scoped.hoa.admin@example.com").orElseThrow();
        CommunityEntity secondCommunity = createCommunity("willow-creek", "Willow Creek");
        residentCommunityMembershipService.activateMembership(admin, secondCommunity);
        residentCommunityMembershipService.syncCommunityAdmin(admin, secondCommunity, false);

        JsonNode loginJson = loginAndGetAuth("scoped.hoa.admin@example.com", "Passw0rd!");
        JsonNode switchedJson = objectMapper.readTree(
                mockMvc.perform(post("/api/v1/auth/switch-community")
                                .header("Authorization", "Bearer " + loginJson.get("accessToken").asText())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "communityId": %d,
                                          "refreshToken": "%s"
                                        }
                                        """.formatted(secondCommunity.getId(), loginJson.get("refreshToken").asText())))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        mockMvc.perform(post("/api/v1/board/news")
                        .header("Authorization", "Bearer " + switchedJson.get("accessToken").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Blocked Update",
                                  "body": "This should not be allowed",
                                  "mediaUrls": []
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void meCommunitiesListsAvailableMembershipsAndMarksActiveSessionCommunity() throws Exception {
        createUser("communities@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        CommunityEntity secondCommunity = createCommunity("pine-ridge", "Pine Ridge");
        residentCommunityMembershipService.activateMembership(
                userRepository.findByEmailIgnoreCase("communities@example.com").orElseThrow(),
                secondCommunity
        );

        JsonNode loginJson = loginAndGetAuth("communities@example.com", "Passw0rd!");
        String accessToken = loginJson.get("accessToken").asText();
        String refreshToken = loginJson.get("refreshToken").asText();

        JsonNode switchedJson = objectMapper.readTree(
                mockMvc.perform(post("/api/v1/auth/switch-community")
                                .header("Authorization", "Bearer " + accessToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "communityId": %d,
                                          "refreshToken": "%s"
                                        }
                                        """.formatted(secondCommunity.getId(), refreshToken)))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );

        mockMvc.perform(get("/api/v1/me/communities")
                        .header("Authorization", "Bearer " + switchedJson.get("accessToken").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].communitySlug").value("pine-ridge"))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$[1].communitySlug").value("silverleaf-reserve"))
                .andExpect(jsonPath("$[1].active").value(false));
    }

    @Test
    void userCannotSwitchToUnavailableCommunity() throws Exception {
        createUser("no-switch@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        JsonNode loginJson = loginAndGetAuth("no-switch@example.com", "Passw0rd!");
        String accessToken = loginJson.get("accessToken").asText();
        String refreshToken = loginJson.get("refreshToken").asText();

        CommunityEntity unavailableCommunity = createCommunity("maple-trace", "Maple Trace");

        mockMvc.perform(post("/api/v1/auth/switch-community")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "communityId": %d,
                                  "refreshToken": "%s"
                                }
                                """.formatted(unavailableCommunity.getId(), refreshToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Community is not available for this resident"));
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
                .andExpect(jsonPath("$.media.length()").value(1))
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.commentsCount").value(0));

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + token)
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].likesCount").exists())
                .andExpect(jsonPath("$.items[0].commentsCount").exists())
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
    void residentsCanLikeCommentAndOwnerCanDeletePost() throws Exception {
        createUser("feed.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("feed.viewer@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String ownerToken = loginAndGetAccessToken("feed.owner@example.com", "Passw0rd!");
        String viewerToken = loginAndGetAccessToken("feed.viewer@example.com", "Passw0rd!");

        MvcResult createdPostResult = mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Post for interactions"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long postId = objectMapper.readTree(createdPostResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/likes")
                        .header("Authorization", "Bearer " + viewerToken)
                        .param("reaction", "CLAP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(postId))
                .andExpect(jsonPath("$.viewerReaction").value("CLAP"))
                .andExpect(jsonPath("$.likesCount").value(1))
                .andExpect(jsonPath("$.reactionCounts.CLAP").value(1));

        mockMvc.perform(post("/api/v1/feed/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Great post!"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Great post!"));

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + ownerToken)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(postId))
                .andExpect(jsonPath("$.items[0].likesCount").value(1))
                .andExpect(jsonPath("$.items[0].viewerReaction").value(nullValue()))
                .andExpect(jsonPath("$.items[0].reactionCounts.CLAP").value(1))
                .andExpect(jsonPath("$.items[0].commentsCount").value(1))
                .andExpect(jsonPath("$.items[0].comments[0].text").value("Great post!"));

        mockMvc.perform(delete("/api/v1/feed/posts/" + postId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/feed/posts/" + postId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void privateGroupJoinRequestCanBeApprovedByOwner() throws Exception {
        createUser("group.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("group.member@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String ownerToken = loginAndGetAccessToken("group.owner@example.com", "Passw0rd!");
        String memberToken = loginAndGetAccessToken("group.member@example.com", "Passw0rd!");

        MvcResult createGroupResult = mockMvc.perform(post("/api/v1/groups")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Board Watch",
                                  "description": "Private planning group",
                                  "visibility": "PRIVATE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Board Watch"))
                .andExpect(jsonPath("$.visibility").value("PRIVATE"))
                .andExpect(jsonPath("$.subscribed").value(true))
                .andExpect(jsonPath("$.owner").value(true))
                .andReturn();

        long groupId = objectMapper.readTree(createGroupResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/groups/" + groupId + "/subscribe")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribed").value(false))
                .andExpect(jsonPath("$.requestPending").value(true))
                .andExpect(jsonPath("$.requestStatus").value("PENDING"))
                .andExpect(jsonPath("$.pendingRequestCount").value(1));

        MvcResult pendingRequestsResult = mockMvc.perform(get("/api/v1/groups/requests")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].groupId").value(groupId))
                .andExpect(jsonPath("$[0].requesterEmail").value("group.member@example.com"))
                .andReturn();

        long requestId = objectMapper.readTree(pendingRequestsResult.getResponse().getContentAsString()).get(0).get("requestId").asLong();

        mockMvc.perform(post("/api/v1/groups/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupId").value(groupId))
                .andExpect(jsonPath("$.requesterEmail").value("group.member@example.com"));

        mockMvc.perform(get("/api/v1/groups")
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(groupId))
                .andExpect(jsonPath("$[0].subscribed").value(true))
                .andExpect(jsonPath("$[0].requestPending").value(false))
                .andExpect(jsonPath("$[0].requestStatus").value("APPROVED"))
                .andExpect(jsonPath("$[0].memberCount").value(2));
    }

    @Test
    void privateGroupFeedRequiresMembershipUntilOwnerApprovesRequest() throws Exception {
        createUser("group.feed.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("group.feed.viewer@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String ownerToken = loginAndGetAccessToken("group.feed.owner@example.com", "Passw0rd!");
        String viewerToken = loginAndGetAccessToken("group.feed.viewer@example.com", "Passw0rd!");

        MvcResult createGroupResult = mockMvc.perform(post("/api/v1/groups")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Landscape Committee",
                                  "description": "Private landscaping discussion",
                                  "visibility": "PRIVATE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("landscape-committee"))
                .andReturn();

        JsonNode createdGroup = objectMapper.readTree(createGroupResult.getResponse().getContentAsString());
        long groupId = createdGroup.get("id").asLong();
        String groupSlug = createdGroup.get("slug").asText();

        mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Private landscaping update",
                                  "channel": "GROUP",
                                  "groupSlug": "%s"
                                }
                                """.formatted(groupSlug)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.channel").value("GROUP"))
                .andExpect(jsonPath("$.groupSlug").value(groupSlug))
                .andExpect(jsonPath("$.text").value("Private landscaping update"));

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + viewerToken)
                        .param("channel", "GROUP")
                        .param("groupSlug", groupSlug))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Group is private"));

        MvcResult subscribeResult = mockMvc.perform(post("/api/v1/groups/" + groupId + "/subscribe")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestPending").value(true))
                .andReturn();

        long requestId = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/groups/requests")
                                .header("Authorization", "Bearer " + ownerToken))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        ).get(0).get("requestId").asLong();

        mockMvc.perform(post("/api/v1/groups/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + viewerToken)
                        .param("channel", "GROUP")
                        .param("groupSlug", groupSlug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].channel").value("GROUP"))
                .andExpect(jsonPath("$.items[0].groupSlug").value(groupSlug))
                .andExpect(jsonPath("$.items[0].text").value("Private landscaping update"));
    }

    @Test
    void hoaAdminCanInviteResidentAndResidentCanAcceptInvitation() throws Exception {
        createUser("hoa.invites@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("hoa.invites@example.com", "Passw0rd!");

        HouseEntity invitedHouse = new HouseEntity();
        invitedHouse.setCommunity(communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow());
        invitedHouse.setAddress("789 Magnolia Court");
        invitedHouse.setQrToken("invite-house-789");
        invitedHouse.setStatus(HouseStatus.UNKNOWN);
        houseRepository.save(invitedHouse);

        MvcResult inviteResult = mockMvc.perform(post("/api/v1/residents/invitations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Invited Resident",
                                  "email": "invited.resident@example.com",
                                  "password": "Passw0rd!",
                                  "houseId": %d
                                }
                                """.formatted(invitedHouse.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("invited.resident@example.com"))
                .andExpect(jsonPath("$.houseId").value(invitedHouse.getId()))
                .andExpect(jsonPath("$.houseAddress").value("789 Magnolia Court"))
                .andExpect(jsonPath("$.invitationToken").isNotEmpty())
                .andReturn();

        JsonNode inviteJson = objectMapper.readTree(inviteResult.getResponse().getContentAsString());
        String invitationToken = inviteJson.get("invitationToken").asText();

        mockMvc.perform(get("/api/v1/public/onboarding/invitations/" + invitationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("invited.resident@example.com"))
                .andExpect(jsonPath("$.houseAddress").value("789 Magnolia Court"))
                .andExpect(jsonPath("$.expired").value(false));

        String residentToken = loginAndGetAccessToken("invited.resident@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/public/onboarding/invitations/" + invitationToken + "/accept")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.houseId").value(invitedHouse.getId()))
                .andExpect(jsonPath("$.houseAddress").value("789 Magnolia Court"));

        mockMvc.perform(get("/api/v1/public/onboarding/invitations/" + invitationToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expired").value(true));

        HouseEntity updatedHouse = houseRepository.findById(invitedHouse.getId()).orElseThrow();
        assertThat(updatedHouse.getStatus()).isEqualTo(HouseStatus.OCCUPIED);
        assertThat(updatedHouse.getClaimedAt()).isNotNull();

        assertThat(houseResidentRepository.findByResidentIdAndActiveTrueOrderByMovedInAtDescIdDesc(
                userRepository.findByEmailIgnoreCase("invited.resident@example.com").orElseThrow().getId()
        )).hasSize(1);
    }

    @Test
    void hoaAdminCannotInviteResidentIntoDifferentCommunityHouse() throws Exception {
        createUser("hoa.crosscommunity@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String adminToken = loginAndGetAccessToken("hoa.crosscommunity@example.com", "Passw0rd!");

        CommunityEntity otherCommunity = createCommunity("palm-grove", "Palm Grove");
        HouseEntity otherCommunityHouse = new HouseEntity();
        otherCommunityHouse.setCommunity(otherCommunity);
        otherCommunityHouse.setAddress("77 Palm Grove Lane");
        otherCommunityHouse.setQrToken("palm-grove-77");
        otherCommunityHouse.setStatus(HouseStatus.UNKNOWN);
        houseRepository.save(otherCommunityHouse);

        mockMvc.perform(post("/api/v1/residents/invitations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Blocked Invite",
                                  "email": "blocked.invite@example.com",
                                  "password": "Passw0rd!",
                                  "houseId": %d
                                }
                                """.formatted(otherCommunityHouse.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("House does not belong to your community"));
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

    @Test
    void residentCanUpdateProfileAndManageHousehold() throws Exception {
        createUser("resident.house@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        HouseEntity house = new HouseEntity();
        house.setCommunity(communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).orElseThrow());
        house.setAddress("555 Cypress Lane");
        house.setQrToken("house555");
        house.setStatus(HouseStatus.OCCUPIED);
        houseRepository.save(house);

        HouseResidentEntity primaryResident = new HouseResidentEntity();
        primaryResident.setHouse(house);
        primaryResident.setResident(userRepository.findByEmailIgnoreCase("resident.house@example.com").orElseThrow());
        primaryResident.setActive(true);
        primaryResident.setMovedInAt(java.time.Instant.now());
        houseResidentRepository.save(primaryResident);

        String token = loginAndGetAccessToken("resident.house@example.com", "Passw0rd!");

        mockMvc.perform(put("/api/v1/me/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Resident Updated",
                                  "email": "resident.house@example.com",
                                  "password": "NewPassw0rd!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Resident Updated"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "resident.house@example.com",
                                  "password": "Passw0rd!"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        String refreshedToken = loginAndGetAccessToken("resident.house@example.com", "NewPassw0rd!");

        mockMvc.perform(get("/api/v1/me/household")
                        .header("Authorization", "Bearer " + refreshedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.houseAddress").value("555 Cypress Lane"))
                .andExpect(jsonPath("$.residents.length()").value(1));

        mockMvc.perform(post("/api/v1/me/household/members")
                        .header("Authorization", "Bearer " + refreshedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Spouse Resident",
                                  "email": "spouse@example.com"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.residents.length()").value(2));

        UserEntity spouseUser = userRepository.findByEmailIgnoreCase("spouse@example.com").orElse(null);
        assertThat(spouseUser).isNotNull();
        assertThat(spouseUser.getRole()).isEqualTo(UserRole.RESIDENT);
    }

    @Test
    void onboardingCompletionActivatesMembershipForHouseCommunity() throws Exception {
        CommunityEntity otherCommunity = createCommunity("sunset-bay", "Sunset Bay");
        HouseEntity house = new HouseEntity();
        house.setCommunity(otherCommunity);
        house.setAddress("14 Sunset Bay Circle");
        house.setQrToken("sunset-bay-14");
        house.setStatus(HouseStatus.UNKNOWN);
        houseRepository.save(house);

        MvcResult startResult = mockMvc.perform(post("/api/v1/public/onboarding/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "houseId": %d
                                }
                                """.formatted(house.getId())))
                .andExpect(status().isOk())
                .andReturn();

        String sessionToken = objectMapper.readTree(startResult.getResponse().getContentAsString()).get("sessionToken").asText();

        MvcResult contactResult = mockMvc.perform(post("/api/v1/public/onboarding/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "contactType": "EMAIL",
                                  "contactValue": "sunset.member@example.com"
                                }
                                """.formatted(sessionToken)))
                .andExpect(status().isOk())
                .andReturn();

        String verificationToken = objectMapper.readTree(contactResult.getResponse().getContentAsString()).get("verificationToken").asText();

        mockMvc.perform(get("/api/v1/public/onboarding/verify/" + verificationToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/public/onboarding/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sessionToken": "%s",
                                  "provider": "google",
                                  "providerSubject": "sunset-member-1",
                                  "fullName": "Sunset Member",
                                  "email": "sunset.member@example.com"
                                }
                                """.formatted(sessionToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("14 Sunset Bay Circle"));

        UserEntity onboardedUser = userRepository.findByEmailIgnoreCase("sunset.member@example.com").orElseThrow();
        assertThat(residentCommunityMembershipRepository
                .findFirstByResidentIdAndActiveTrueOrderByUpdatedAtDescIdDesc(onboardedUser.getId()))
                .isPresent()
                .get()
                .extracting(membership -> membership.getCommunity().getSlug())
                .isEqualTo("sunset-bay");
    }

    @Test
    void groupsAndFeedAreIsolatedByResolvedCommunity() throws Exception {
        createUser("default.community.owner@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("other.community.viewer@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String defaultOwnerToken = loginAndGetAccessToken("default.community.owner@example.com", "Passw0rd!");

        CommunityEntity otherCommunity = createCommunity("oak-hollow", "Oak Hollow");
        HouseEntity otherHouse = new HouseEntity();
        otherHouse.setCommunity(otherCommunity);
        otherHouse.setAddress("12 Oak Hollow Drive");
        otherHouse.setQrToken("oak-hollow-12");
        otherHouse.setStatus(HouseStatus.OCCUPIED);
        houseRepository.save(otherHouse);

        HouseResidentEntity otherCommunityMembership = new HouseResidentEntity();
        otherCommunityMembership.setHouse(otherHouse);
        otherCommunityMembership.setResident(userRepository.findByEmailIgnoreCase("other.community.viewer@example.com").orElseThrow());
        otherCommunityMembership.setActive(true);
        otherCommunityMembership.setMovedInAt(java.time.Instant.now());
        houseResidentRepository.save(otherCommunityMembership);
        residentCommunityMembershipService.activateMembership(otherCommunityMembership.getResident(), otherCommunity);
        String otherViewerToken = loginAndGetAccessToken("other.community.viewer@example.com", "Passw0rd!");

        MvcResult groupResult = mockMvc.perform(post("/api/v1/groups")
                        .header("Authorization", "Bearer " + defaultOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Default Community Group",
                                  "description": "Only for the default community",
                                  "visibility": "PUBLIC"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        long groupId = objectMapper.readTree(groupResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/feed/posts")
                        .header("Authorization", "Bearer " + defaultOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Default community update"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/groups")
                        .header("Authorization", "Bearer " + otherViewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(post("/api/v1/groups/" + groupId + "/subscribe")
                        .header("Authorization", "Bearer " + otherViewerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Group not found"));

        mockMvc.perform(get("/api/v1/feed")
                        .header("Authorization", "Bearer " + otherViewerToken)
                        .param("channel", "COMMUNITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void boardAndGarageSalesAreIsolatedByResolvedCommunity() throws Exception {
        createUser("default.board.admin@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        createUser("default.board.resident@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("other.board.admin@example.com", "Passw0rd!", UserRole.HOA_ADMIN, true);
        String defaultAdminToken = loginAndGetAccessToken("default.board.admin@example.com", "Passw0rd!");
        String defaultResidentToken = loginAndGetAccessToken("default.board.resident@example.com", "Passw0rd!");

        CommunityEntity otherCommunity = createCommunity("lake-vista", "Lake Vista");
        HouseEntity otherAdminHouse = new HouseEntity();
        otherAdminHouse.setCommunity(otherCommunity);
        otherAdminHouse.setAddress("401 Lake Vista Court");
        otherAdminHouse.setQrToken("lake-vista-401");
        otherAdminHouse.setStatus(HouseStatus.OCCUPIED);
        houseRepository.save(otherAdminHouse);

        HouseResidentEntity otherAdminMembership = new HouseResidentEntity();
        otherAdminMembership.setHouse(otherAdminHouse);
        otherAdminMembership.setResident(userRepository.findByEmailIgnoreCase("other.board.admin@example.com").orElseThrow());
        otherAdminMembership.setActive(true);
        otherAdminMembership.setMovedInAt(java.time.Instant.now());
        houseResidentRepository.save(otherAdminMembership);
        residentCommunityMembershipService.activateMembership(otherAdminMembership.getResident(), otherCommunity);
        String otherAdminToken = loginAndGetAccessToken("other.board.admin@example.com", "Passw0rd!");

        mockMvc.perform(post("/api/v1/board/news")
                        .header("Authorization", "Bearer " + defaultAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Default Community News",
                                  "body": "Important update for the default community",
                                  "mediaUrls": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Default Community News"));

        mockMvc.perform(post("/api/v1/board/broadcasts")
                        .header("Authorization", "Bearer " + defaultAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Default Broadcast",
                                  "body": "Broadcast for default residents"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Default Broadcast"));

        mockMvc.perform(post("/api/v1/board/polls")
                        .header("Authorization", "Bearer " + defaultAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "question": "Approve gate repaint?",
                                  "options": ["Yes", "No"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.question").value("Approve gate repaint?"));

        mockMvc.perform(post("/api/v1/violations")
                        .header("Authorization", "Bearer " + defaultResidentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Trash cans left outside",
                                  "mediaUrls": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Trash cans left outside"));

        mockMvc.perform(post("/api/v1/garage-sales")
                        .header("Authorization", "Bearer " + defaultResidentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Patio Chairs",
                                  "price": "$40",
                                  "condition": "Used",
                                  "category": "Furniture",
                                  "description": "Set of two patio chairs",
                                  "media": []
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Patio Chairs"));

        mockMvc.perform(get("/api/v1/news")
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/broadcasts")
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/polls")
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/board/violations")
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/garage-sales")
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void directMessagesCannotCrossCommunityBoundaries() throws Exception {
        createUser("default.message.sender@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        createUser("other.message.recipient@example.com", "Passw0rd!", UserRole.RESIDENT, true);
        String senderToken = loginAndGetAccessToken("default.message.sender@example.com", "Passw0rd!");
        String recipientToken = loginAndGetAccessToken("other.message.recipient@example.com", "Passw0rd!");

        CommunityEntity otherCommunity = createCommunity("harbor-point", "Harbor Point");
        HouseEntity recipientHouse = new HouseEntity();
        recipientHouse.setCommunity(otherCommunity);
        recipientHouse.setAddress("88 Harbor Point Blvd");
        recipientHouse.setQrToken("harbor-point-88");
        recipientHouse.setStatus(HouseStatus.OCCUPIED);
        houseRepository.save(recipientHouse);

        UserEntity recipientUser = userRepository.findByEmailIgnoreCase("other.message.recipient@example.com").orElseThrow();
        HouseResidentEntity recipientMembership = new HouseResidentEntity();
        recipientMembership.setHouse(recipientHouse);
        recipientMembership.setResident(recipientUser);
        recipientMembership.setActive(true);
        recipientMembership.setMovedInAt(java.time.Instant.now());
        houseResidentRepository.save(recipientMembership);
        residentCommunityMembershipService.activateMembership(recipientUser, otherCommunity);

        mockMvc.perform(post("/api/v1/messages")
                        .header("Authorization", "Bearer " + senderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "recipientUserId": %d,
                                  "body": "Hello from another community"
                                }
                                """.formatted(recipientUser.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Resident does not belong to your community"));

        mockMvc.perform(get("/api/v1/messages/thread/" + recipientUser.getId())
                        .header("Authorization", "Bearer " + senderToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Resident does not belong to your community"));

        mockMvc.perform(get("/api/v1/messages/conversations")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    private String loginAndGetAccessToken(String email, String password) throws Exception {
        return loginAndGetAuth(email, password).get("accessToken").asText();
    }

    private JsonNode loginAndGetAuth(String email, String password) throws Exception {
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

        return objectMapper.readTree(loginResult.getResponse().getContentAsString());
    }

    private void createUser(String email, String password, UserRole role, boolean enabled) {
        UserEntity user = new UserEntity();
        user.setFullName("Test User");
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(enabled);
        UserEntity saved = userRepository.save(user);
        residentCommunityMembershipService.ensureDefaultMembership(saved);
    }

    private CommunityEntity createCommunity(String slug, String name) {
        CommunityEntity community = new CommunityEntity();
        community.setSlug(slug);
        community.setName(name);
        return communityRepository.save(community);
    }
}
