package com.hoa.silverleaf.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReactAppForwardController {

    @GetMapping({
            "/app",
            "/app/",
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
            "/app/reservations",
            "/app/reservations/",
            "/app/profile",
            "/app/profile/",
            "/app/map",
            "/app/map/",
            "/app/messages",
            "/app/messages/"
    })
    public String forwardReactAppRoutes() {
        // Forward known SPA routes to the React entrypoint so React Router handles client navigation.
        return "forward:/app/index.html";
    }
}
