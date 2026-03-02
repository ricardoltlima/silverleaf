package com.hoa.silverleaf.users;

public enum UserRole {
    RESIDENT,
    TENANT,
    HOA_ADMIN,
    ADMIN;

    public boolean isHoaManager() {
        return this == HOA_ADMIN || this == ADMIN;
    }

    public boolean canVoteInHoaPolls() {
        return this != TENANT;
    }

    public boolean isCommunityMember() {
        return this == RESIDENT || this == TENANT || this == HOA_ADMIN;
    }
}
