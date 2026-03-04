package com.hoa.silverleaf.garagesales;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.garagesales.dto.CreateGarageSaleItemMediaRequest;
import com.hoa.silverleaf.garagesales.dto.CreateGarageSaleItemRequest;
import com.hoa.silverleaf.garagesales.dto.GarageSaleItemMediaResponse;
import com.hoa.silverleaf.garagesales.dto.GarageSaleItemResponse;
import com.hoa.silverleaf.garagesales.dto.UpdateGarageSaleItemRequest;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GarageSaleService {

    private final GarageSaleItemRepository garageSaleItemRepository;
    private final GarageSaleItemMediaRepository garageSaleItemMediaRepository;
    private final UserRepository userRepository;
    private final CommunityAccessService communityAccessService;

    public GarageSaleService(
            GarageSaleItemRepository garageSaleItemRepository,
            GarageSaleItemMediaRepository garageSaleItemMediaRepository,
            UserRepository userRepository,
            CommunityAccessService communityAccessService
    ) {
        this.garageSaleItemRepository = garageSaleItemRepository;
        this.garageSaleItemMediaRepository = garageSaleItemMediaRepository;
        this.userRepository = userRepository;
        this.communityAccessService = communityAccessService;
    }

    @Transactional(readOnly = true)
    public List<GarageSaleItemResponse> listItems(AppUserPrincipal principal) {
        List<GarageSaleItemEntity> items = garageSaleItemRepository.findAllByCommunityIdOrderByCreatedAtDescIdDesc(
                communityAccessService.requireCommunityIdForPrincipal(principal)
        );
        List<Long> itemIds = items.stream().map(GarageSaleItemEntity::getId).toList();
        Map<Long, List<GarageSaleItemMediaResponse>> mediaByItemId = loadMediaByItemIds(itemIds);

        return items.stream()
                .map(item -> toResponse(item, mediaByItemId.getOrDefault(item.getId(), List.of())))
                .toList();
    }

    @Transactional
    public GarageSaleItemResponse createItem(AppUserPrincipal principal, CreateGarageSaleItemRequest request) {
        UserEntity seller = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        GarageSaleItemEntity item = new GarageSaleItemEntity();
        item.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        item.setSeller(seller);
        item.setTitle(request.title().trim());
        item.setPriceLabel(request.price().trim());
        item.setConditionLabel(request.condition().trim());
        item.setCategory(request.category().trim());
        item.setDescription(trimToNull(request.description()));
        GarageSaleItemEntity saved = garageSaleItemRepository.save(item);

        List<GarageSaleItemMediaResponse> mediaResponses = new ArrayList<>();
        List<CreateGarageSaleItemMediaRequest> media = request.media() == null ? List.of() : request.media();
        for (int index = 0; index < media.size(); index++) {
            CreateGarageSaleItemMediaRequest requestMedia = media.get(index);
            GarageSaleItemMediaEntity entity = new GarageSaleItemMediaEntity();
            entity.setItem(saved);
            entity.setMediaType(requestMedia.type());
            entity.setMediaUrl(requestMedia.url().trim());
            entity.setSortOrder(index);
            garageSaleItemMediaRepository.save(entity);
            mediaResponses.add(new GarageSaleItemMediaResponse(requestMedia.type(), requestMedia.url().trim()));
        }
        log.info("Garage sale item created itemId={} sellerUserId={} title={} mediaCount={}",
                saved.getId(), seller.getId(), saved.getTitle(), mediaResponses.size());
        return toResponse(saved, mediaResponses);
    }

    @Transactional
    public GarageSaleItemResponse updateItem(AppUserPrincipal principal, Long itemId, UpdateGarageSaleItemRequest request) {
        GarageSaleItemEntity item = requireItemInCommunity(itemId, principal);
        requireItemManager(item, principal);
        item.setTitle(request.title().trim());
        item.setPriceLabel(request.price().trim());
        item.setConditionLabel(request.condition().trim());
        item.setCategory(request.category().trim());
        item.setDescription(trimToNull(request.description()));
        GarageSaleItemEntity saved = garageSaleItemRepository.save(item);
        List<GarageSaleItemMediaResponse> media = loadMediaByItemIds(List.of(itemId)).getOrDefault(itemId, List.of());
        return toResponse(saved, media);
    }

    @Transactional
    public void deleteItem(AppUserPrincipal principal, Long itemId) {
        GarageSaleItemEntity item = requireItemInCommunity(itemId, principal);
        requireItemManager(item, principal);
        garageSaleItemMediaRepository.deleteByItemId(itemId);
        garageSaleItemRepository.delete(item);
    }

    private Map<Long, List<GarageSaleItemMediaResponse>> loadMediaByItemIds(List<Long> itemIds) {
        if (itemIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<GarageSaleItemMediaResponse>> byItemId = new HashMap<>();
        garageSaleItemMediaRepository.findByItemIdInOrderBySortOrderAscIdAsc(itemIds).forEach(media -> byItemId
                .computeIfAbsent(media.getItem().getId(), ignored -> new ArrayList<>())
                .add(new GarageSaleItemMediaResponse(media.getMediaType(), media.getMediaUrl())));
        return byItemId;
    }

    private GarageSaleItemResponse toResponse(GarageSaleItemEntity item, List<GarageSaleItemMediaResponse> media) {
        return new GarageSaleItemResponse(
                item.getId(),
                item.getSeller().getId(),
                item.getTitle(),
                item.getPriceLabel(),
                item.getConditionLabel(),
                item.getCategory(),
                item.getDescription(),
                item.getSeller().getFullName(),
                item.getSeller().getEmail(),
                item.getSeller().getPhoneNumber(),
                item.getSeller().getPhotoUrl(),
                item.getCreatedAt(),
                media
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private GarageSaleItemEntity requireItemInCommunity(Long itemId, AppUserPrincipal principal) {
        return garageSaleItemRepository.findByIdAndCommunityId(itemId, communityAccessService.requireCommunityIdForPrincipal(principal))
                .orElseThrow(() -> new NotFoundException("Garage sale item not found"));
    }

    private void requireItemManager(GarageSaleItemEntity item, AppUserPrincipal principal) {
        if (item.getSeller().getId().equals(principal.getId()) || communityAccessService.isCurrentCommunityAdmin(principal)) {
            return;
        }
        throw new AccessDeniedException("You cannot manage this listing");
    }
}
