package com.hoa.silverleaf.board;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoa.silverleaf.board.dto.*;
import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.feed.FeedService;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import com.hoa.silverleaf.users.UserRole;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
public class BoardService {

    private final NewsRepository newsRepository;
    private final BroadcastRepository broadcastRepository;
    private final PollRepository pollRepository;
    private final PollVoteRepository pollVoteRepository;
    private final ViolationReportRepository violationReportRepository;
    private final UserRepository userRepository;
    private final CommunityAccessService communityAccessService;
    private final ObjectMapper objectMapper;

    public BoardService(
            NewsRepository newsRepository,
            BroadcastRepository broadcastRepository,
            PollRepository pollRepository,
            PollVoteRepository pollVoteRepository,
            ViolationReportRepository violationReportRepository,
            UserRepository userRepository,
            CommunityAccessService communityAccessService,
            ObjectMapper objectMapper
    ) {
        this.newsRepository = newsRepository;
        this.broadcastRepository = broadcastRepository;
        this.pollRepository = pollRepository;
        this.pollVoteRepository = pollVoteRepository;
        this.violationReportRepository = violationReportRepository;
        this.userRepository = userRepository;
        this.communityAccessService = communityAccessService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public NewsPageResponse listNews(AppUserPrincipal principal, String cursor, int limit) {
        int pageSize = Math.max(1, Math.min(limit, 50));
        FeedService.CursorParts cursorParts = FeedService.parseCursor(cursor);
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<NewsEntity> loadedItems = cursorParts.createdAt() == null || cursorParts.id() == null
                ? newsRepository.findAllByCommunityIdOrderByCreatedAtDescIdDesc(communityId, PageRequest.of(0, pageSize + 1))
                : newsRepository.findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
                        communityId,
                        cursorParts.createdAt(),
                        cursorParts.id(),
                        PageRequest.of(0, pageSize + 1)
                );
        boolean hasMore = loadedItems.size() > pageSize;
        List<NewsEntity> items = hasMore ? loadedItems.subList(0, pageSize) : loadedItems;
        List<NewsResponse> responses = items.stream()
                .map(this::toNewsResponse)
                .toList();
        String nextCursor = hasMore && !responses.isEmpty()
                ? FeedService.buildCursor(responses.get(responses.size() - 1).createdAt(), responses.get(responses.size() - 1).id())
                : null;
        return new NewsPageResponse(responses, nextCursor);
    }

    @Transactional
    public NewsResponse createNews(AppUserPrincipal principal, CreateNewsRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        UserEntity author = requireUser(principal.getId());
        NewsEntity entity = new NewsEntity();
        entity.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        entity.setTitle(request.title().trim());
        entity.setBodyText(request.body().trim());
        entity.setMediaUrlsText(serializeUrls(request.mediaUrls()));
        entity.setAuthor(author);
        NewsEntity saved = newsRepository.save(entity);
        return toNewsResponse(saved);
    }

    @Transactional
    public NewsResponse updateNews(AppUserPrincipal principal, Long newsId, UpdateNewsRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        NewsEntity news = newsRepository.findByIdAndCommunityId(
                        newsId,
                        communityAccessService.requireCommunityIdForPrincipal(principal)
                )
                .orElseThrow(() -> new NotFoundException("News not found"));
        news.setTitle(request.title().trim());
        news.setBodyText(request.body().trim());
        news.setMediaUrlsText(serializeUrls(request.mediaUrls()));
        NewsEntity saved = newsRepository.save(news);
        return toNewsResponse(saved);
    }

    @Transactional
    public void deleteNews(AppUserPrincipal principal, Long newsId) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        NewsEntity news = newsRepository.findByIdAndCommunityId(
                        newsId,
                        communityAccessService.requireCommunityIdForPrincipal(principal)
                )
                .orElseThrow(() -> new NotFoundException("News not found"));
        newsRepository.delete(news);
    }

    @Transactional(readOnly = true)
    public BroadcastPageResponse listBroadcasts(AppUserPrincipal principal, String cursor, int limit) {
        int pageSize = Math.max(1, Math.min(limit, 50));
        FeedService.CursorParts cursorParts = FeedService.parseCursor(cursor);
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<BroadcastEntity> loadedItems = cursorParts.createdAt() == null || cursorParts.id() == null
                ? broadcastRepository.findAllByCommunityIdOrderByCreatedAtDescIdDesc(communityId, PageRequest.of(0, pageSize + 1))
                : broadcastRepository.findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
                        communityId,
                        cursorParts.createdAt(),
                        cursorParts.id(),
                        PageRequest.of(0, pageSize + 1)
                );
        boolean hasMore = loadedItems.size() > pageSize;
        List<BroadcastEntity> items = hasMore ? loadedItems.subList(0, pageSize) : loadedItems;
        List<BroadcastResponse> responses = items.stream()
                .map(b -> new BroadcastResponse(b.getId(), b.getTitle(), b.getBodyText(), b.getAuthor().getFullName(), b.getCreatedAt()))
                .toList();
        String nextCursor = hasMore && !responses.isEmpty()
                ? FeedService.buildCursor(responses.get(responses.size() - 1).createdAt(), responses.get(responses.size() - 1).id())
                : null;
        return new BroadcastPageResponse(responses, nextCursor);
    }

    @Transactional
    public BroadcastResponse createBroadcast(AppUserPrincipal principal, CreateBroadcastRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        UserEntity author = requireUser(principal.getId());
        BroadcastEntity entity = new BroadcastEntity();
        entity.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        entity.setTitle(request.title().trim());
        entity.setBodyText(request.body().trim());
        entity.setAuthor(author);
        BroadcastEntity saved = broadcastRepository.save(entity);
        return new BroadcastResponse(saved.getId(), saved.getTitle(), saved.getBodyText(), author.getFullName(), saved.getCreatedAt());
    }

    @Transactional
    public PollResponse createPoll(AppUserPrincipal principal, CreatePollRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        if (request.options() == null || request.options().size() < 2) {
            throw new IllegalArgumentException("Poll needs at least 2 options");
        }
        UserEntity author = requireUser(principal.getId());
        PollEntity poll = new PollEntity();
        poll.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        poll.setQuestion(request.question().trim());
        poll.setOptionsText(serializeOptions(request.options()));
        poll.setActive(true);
        poll.setAuthor(author);
        PollEntity saved = pollRepository.save(poll);
        return toPollResponse(saved, List.of(), principal.getId());
    }

    @Transactional(readOnly = true)
    public List<PollResponse> listActivePolls(AppUserPrincipal principal) {
        List<PollEntity> polls = pollRepository.findByCommunityIdAndActiveTrueOrderByCreatedAtDescIdDesc(
                communityAccessService.requireCommunityIdForPrincipal(principal)
        );
        List<Long> pollIds = polls.stream().map(PollEntity::getId).toList();
        Map<Long, List<PollVoteEntity>> votesByPollId = new HashMap<>();
        if (!pollIds.isEmpty()) {
            pollVoteRepository.findByPollIdIn(pollIds).forEach(vote ->
                    votesByPollId.computeIfAbsent(vote.getPoll().getId(), ignored -> new ArrayList<>()).add(vote)
            );
        }
        return polls.stream()
                .map(poll -> toPollResponse(poll, votesByPollId.getOrDefault(poll.getId(), List.of()), principal.getId()))
                .toList();
    }

    @Transactional
    public PollResponse vote(AppUserPrincipal principal, Long pollId, VotePollRequest request) {
        PollEntity poll = pollRepository.findByIdAndCommunityId(
                        pollId,
                        communityAccessService.requireCommunityIdForPrincipal(principal)
                )
                .orElseThrow(() -> new NotFoundException("Poll not found"));
        if (!poll.isActive()) throw new IllegalArgumentException("Poll is closed");
        List<String> options = deserializeOptions(poll.getOptionsText());
        if (request.optionIndex() < 0 || request.optionIndex() >= options.size()) {
            throw new IllegalArgumentException("Invalid option");
        }
        UserEntity voter = requireUser(principal.getId());
        if (!voter.getRole().canVoteInHoaPolls()) {
            throw new IllegalArgumentException("Tenants cannot vote in HOA polls");
        }
        PollVoteEntity vote = pollVoteRepository.findByPollIdAndVoterId(pollId, voter.getId()).orElseGet(() -> {
            PollVoteEntity created = new PollVoteEntity();
            created.setPoll(poll);
            created.setVoter(voter);
            return created;
        });
        vote.setOptionIndex(request.optionIndex());
        try {
            pollVoteRepository.save(vote);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("You have already voted on this poll");
        }
        List<PollVoteEntity> votes = pollVoteRepository.findByPollIdIn(List.of(pollId));
        return toPollResponse(poll, votes, principal.getId());
    }

    @Transactional
    public ViolationResponse createViolation(AppUserPrincipal principal, CreateViolationRequest request) {
        UserEntity reporter = requireUser(principal.getId());
        ViolationReportEntity entity = new ViolationReportEntity();
        entity.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        entity.setReporter(reporter);
        entity.setDescription(request.description().trim());
        List<String> mediaUrls = deserializeUrls(serializeUrls(request.mediaUrls()));
        entity.setPhotoUrl(trimToNull(request.photoUrl()) != null ? trimToNull(request.photoUrl()) : mediaUrls.stream().findFirst().orElse(null));
        entity.setMediaUrlsText(serializeUrls(request.mediaUrls()));
        entity.setStatus(ViolationStatus.OPEN);
        ViolationReportEntity saved = violationReportRepository.save(entity);
        return toViolationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ViolationResponse> listMyViolations(AppUserPrincipal principal) {
        return violationReportRepository.findByCommunityIdAndReporterIdOrderByCreatedAtDescIdDesc(
                        communityAccessService.requireCommunityIdForPrincipal(principal),
                        principal.getId()
                ).stream()
                .map(this::toViolationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ViolationPageResponse listAllViolations(AppUserPrincipal principal, String cursor, int limit) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        int pageSize = Math.max(1, Math.min(limit, 50));
        FeedService.CursorParts cursorParts = FeedService.parseCursor(cursor);
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<ViolationReportEntity> loadedItems = cursorParts.createdAt() == null || cursorParts.id() == null
                ? violationReportRepository.findAllByCommunityIdOrderByCreatedAtDescIdDesc(communityId, PageRequest.of(0, pageSize + 1))
                : violationReportRepository.findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
                        communityId,
                        cursorParts.createdAt(),
                        cursorParts.id(),
                        PageRequest.of(0, pageSize + 1)
                );
        boolean hasMore = loadedItems.size() > pageSize;
        List<ViolationReportEntity> items = hasMore ? loadedItems.subList(0, pageSize) : loadedItems;
        List<ViolationResponse> responses = items.stream()
                .map(this::toViolationResponse)
                .toList();
        String nextCursor = hasMore && !responses.isEmpty()
                ? FeedService.buildCursor(responses.get(responses.size() - 1).createdAt(), responses.get(responses.size() - 1).id())
                : null;
        return new ViolationPageResponse(responses, nextCursor);
    }

    @Transactional
    public ViolationResponse updateViolationStatus(AppUserPrincipal principal, Long id, UpdateViolationStatusRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        ViolationReportEntity entity = violationReportRepository.findByIdAndCommunityId(
                        id,
                        communityAccessService.requireCommunityIdForPrincipal(principal)
                )
                .orElseThrow(() -> new NotFoundException("Violation not found"));
        entity.setStatus(parseViolationStatus(request.status()));
        ViolationReportEntity saved = violationReportRepository.save(entity);
        return toViolationResponse(saved);
    }

    private UserEntity requireUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private PollResponse toPollResponse(PollEntity poll, List<PollVoteEntity> votes, Long viewerId) {
        List<String> options = deserializeOptions(poll.getOptionsText());
        List<Long> counts = new ArrayList<>(Collections.nCopies(options.size(), 0L));
        Integer viewerVote = null;
        for (PollVoteEntity vote : votes) {
            if (vote.getOptionIndex() >= 0 && vote.getOptionIndex() < counts.size()) {
                counts.set(vote.getOptionIndex(), counts.get(vote.getOptionIndex()) + 1);
            }
            if (vote.getVoter().getId().equals(viewerId)) {
                viewerVote = vote.getOptionIndex();
            }
        }
        return new PollResponse(poll.getId(), poll.getQuestion(), options, counts, viewerVote, poll.isActive(), poll.getCreatedAt());
    }

    private ViolationResponse toViolationResponse(ViolationReportEntity entity) {
        List<String> mediaUrls = deserializeUrls(entity.getMediaUrlsText());
        return new ViolationResponse(
                entity.getId(),
                entity.getDescription(),
                entity.getPhotoUrl(),
                mediaUrls,
                entity.getStatus().name(),
                entity.getReporter().getId(),
                entity.getReporter().getFullName(),
                entity.getCreatedAt()
        );
    }

    private NewsResponse toNewsResponse(NewsEntity entity) {
        return new NewsResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getBodyText(),
                deserializeUrls(entity.getMediaUrlsText()),
                entity.getAuthor().getFullName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String serializeOptions(List<String> options) {
        List<String> normalized = options.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Poll options required");
        }
        return writeJsonArray(normalized);
    }

    private List<String> deserializeOptions(String raw) {
        return readJsonArray(raw);
    }

    private String serializeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return null;
        List<String> normalized = urls.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        return normalized.isEmpty() ? null : writeJsonArray(normalized);
    }

    private List<String> deserializeUrls(String raw) {
        return readJsonArray(raw);
    }

    private ViolationStatus parseViolationStatus(String raw) {
        try {
            return ViolationStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid violation status");
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String writeJsonArray(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Unable to serialize board data", ex);
        }
    }

    private List<String> readJsonArray(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            // Backward compatibility for rows that were not migrated yet.
            return Arrays.stream(raw.split("\\|\\|"))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .toList();
        }
    }
}
