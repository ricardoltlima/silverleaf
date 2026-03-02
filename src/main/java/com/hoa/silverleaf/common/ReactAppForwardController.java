package com.hoa.silverleaf.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReactAppForwardController {

    @GetMapping({
            "/app",
            "/app/",
            "/app/login",
            "/app/login/",
            "/app/feed",
            "/app/feed/",
            "/app/community",
            "/app/community/",
            "/app/services",
            "/app/services/",
            "/app/garage-sales",
            "/app/garage-sales/",
            "/app/alerts",
            "/app/alerts/",
            "/app/groups",
            "/app/groups/",
            "/app/reservations",
            "/app/reservations/",
            "/app/violations",
            "/app/violations/",
            "/app/profile",
            "/app/profile/",
            "/app/messages",
            "/app/messages/",
            "/app/hoa/workspace",
            "/app/hoa/workspace/",
            "/app/system-admin",
            "/app/system-admin/",
            "/app/board/news",
            "/app/board/news/",
            "/app/board/broadcasts",
            "/app/board/broadcasts/",
            "/app/board/polls",
            "/app/board/polls/"
    })
    public String forwardReactAppRoutes() {
        // Forward known SPA routes to the React entrypoint so React Router handles client navigation.
        return "forward:/app/index.html";
    }
}
