package com.hoa.silverleaf.groups;

import com.hoa.silverleaf.groups.dto.CreateGroupRequest;
import com.hoa.silverleaf.groups.dto.GroupJoinRequestResponse;
import com.hoa.silverleaf.groups.dto.GroupResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public List<GroupResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return groupService.listGroupsForUser(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupResponse create(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateGroupRequest request
    ) {
        return groupService.createGroup(principal, request);
    }

    @PostMapping("/{groupId}/subscribe")
    public GroupResponse subscribe(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return groupService.subscribe(principal, groupId);
    }

    @PostMapping("/{groupId}/unsubscribe")
    public GroupResponse unsubscribe(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return groupService.unsubscribe(principal, groupId);
    }

    @GetMapping("/requests")
    public List<GroupJoinRequestResponse> pendingRequests(@AuthenticationPrincipal AppUserPrincipal principal) {
        return groupService.listPendingRequests(principal);
    }

    @PostMapping("/requests/{requestId}/approve")
    public GroupJoinRequestResponse approveRequest(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long requestId
    ) {
        return groupService.approveRequest(principal, requestId);
    }

    @PostMapping("/requests/{requestId}/reject")
    public GroupJoinRequestResponse rejectRequest(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long requestId
    ) {
        return groupService.rejectRequest(principal, requestId);
    }
}
