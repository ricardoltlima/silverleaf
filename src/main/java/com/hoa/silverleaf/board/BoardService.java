package com.hoa.silverleaf.board;

import com.hoa.silverleaf.board.dto.*;
import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import com.hoa.silverleaf.users.UserRole;
import lombok.extern.slf4j.Slf4j;
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

    public BoardService(
            NewsRepository newsRepository,
            BroadcastRepository broadcastRepository,
            PollRepository pollRepository,
            PollVoteRepository pollVoteRepository,
            ViolationReportRepository violationReportRepository,
            UserRepository userRepository
    ) {
        this.newsRepository = newsRepository;
        this.broadcastRepository = broadcastRepository;
        this.pollRepository = pollRepository;
        this.pollVoteRepository = pollVoteRepository;
        this.violationReportRepository = violationReportRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NewsResponse> listNews() {
        return newsRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(this::toNewsResponse)
                .toList();
    }

    @Transactional
    public NewsResponse createNews(AppUserPrincipal principal, CreateNewsRequest request) {
        UserEntity author = requireUser(principal.getId());
        NewsEntity entity = new NewsEntity();
        entity.setTitle(request.title().trim());
        entity.setBodyText(request.body().trim());
        entity.setMediaUrlsText(serializeUrls(request.mediaUrls()));
        entity.setAuthor(author);
        NewsEntity saved = newsRepository.save(entity);
        return toNewsResponse(saved);
    }

    @Transactional
    public NewsResponse updateNews(Long newsId, UpdateNewsRequest request) {
        NewsEntity news = newsRepository.findById(newsId).orElseThrow(() -> new NotFoundException("News not found"));
        news.setTitle(request.title().trim());
        news.setBodyText(request.body().trim());
        news.setMediaUrlsText(serializeUrls(request.mediaUrls()));
        NewsEntity saved = newsRepository.save(news);
        return toNewsResponse(saved);
    }

    @Transactional
    public void deleteNews(Long newsId) {
        NewsEntity news = newsRepository.findById(newsId).orElseThrow(() -> new NotFoundException("News not found"));
        newsRepository.delete(news);
    }

    @Transactional(readOnly = true)
    public List<BroadcastResponse> listBroadcasts() {
        return broadcastRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(b -> new BroadcastResponse(b.getId(), b.getTitle(), b.getBodyText(), b.getAuthor().getFullName(), b.getCreatedAt()))
                .toList();
    }

    @Transactional
    public BroadcastResponse createBroadcast(AppUserPrincipal principal, CreateBroadcastRequest request) {
        UserEntity author = requireUser(principal.getId());
        BroadcastEntity entity = new BroadcastEntity();
        entity.setTitle(request.title().trim());
        entity.setBodyText(request.body().trim());
        entity.setAuthor(author);
        BroadcastEntity saved = broadcastRepository.save(entity);
        return new BroadcastResponse(saved.getId(), saved.getTitle(), saved.getBodyText(), author.getFullName(), saved.getCreatedAt());
    }

    @Transactional
    public PollResponse createPoll(AppUserPrincipal principal, CreatePollRequest request) {
        if (request.options() == null || request.options().size() < 2) {
            throw new IllegalArgumentException("Poll needs at least 2 options");
        }
        UserEntity author = requireUser(principal.getId());
        PollEntity poll = new PollEntity();
        poll.setQuestion(request.question().trim());
        poll.setOptionsText(serializeOptions(request.options()));
        poll.setActive(true);
        poll.setAuthor(author);
        PollEntity saved = pollRepository.save(poll);
        return toPollResponse(saved, List.of(), principal.getId());
    }

    @Transactional(readOnly = true)
    public List<PollResponse> listActivePolls(AppUserPrincipal principal) {
        List<PollEntity> polls = pollRepository.findByActiveTrueOrderByCreatedAtDescIdDesc();
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
        PollEntity poll = pollRepository.findById(pollId).orElseThrow(() -> new NotFoundException("Poll not found"));
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
        pollVoteRepository.save(vote);
        List<PollVoteEntity> votes = pollVoteRepository.findByPollIdIn(List.of(pollId));
        return toPollResponse(poll, votes, principal.getId());
    }

    @Transactional
    public ViolationResponse createViolation(AppUserPrincipal principal, CreateViolationRequest request) {
        UserEntity reporter = requireUser(principal.getId());
        ViolationReportEntity entity = new ViolationReportEntity();
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
        return violationReportRepository.findByReporterIdOrderByCreatedAtDescIdDesc(principal.getId()).stream()
                .map(this::toViolationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ViolationResponse> listAllViolations() {
        return violationReportRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(this::toViolationResponse)
                .toList();
    }

    @Transactional
    public ViolationResponse updateViolationStatus(Long id, UpdateViolationStatusRequest request) {
        ViolationReportEntity entity = violationReportRepository.findById(id)
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
        return options.stream().map(String::trim).filter(value -> !value.isEmpty()).reduce((a, b) -> a + "||" + b)
                .orElseThrow(() -> new IllegalArgumentException("Poll options required"));
    }

    private List<String> deserializeOptions(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\\|\\|")).map(String::trim).filter(v -> !v.isEmpty()).toList();
    }

    private String serializeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return null;
        return urls.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .reduce((a, b) -> a + "||" + b)
                .orElse(null);
    }

    private List<String> deserializeUrls(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\\|\\|")).map(String::trim).filter(v -> !v.isEmpty()).toList();
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
}
