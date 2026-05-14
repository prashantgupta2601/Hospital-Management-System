package com.hms.modules.notification.controller;

import com.hms.modules.notification.dto.NotificationMessage;
import com.hms.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * STOMP WebSocket controller.
 *
 * Clients can send to /app/notify to trigger a broadcast.
 * Server pushes updates to /topic/appointments and /topic/notifications.
 */
@Controller
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Clients send a message to /app/notify.
     * It is echoed back to all subscribers of /topic/notifications.
     */
    @MessageMapping("/notify")
    @SendTo("/topic/notifications")
    public NotificationMessage handleClientNotification(NotificationMessage message) {
        return message;
    }

    /**
     * Clients send a ping to /app/ping.
     * Responds with a GENERAL notification as a health-check / keep-alive.
     */
    @MessageMapping("/ping")
    @SendTo("/topic/notifications")
    public NotificationMessage handlePing() {
        return NotificationMessage.builder()
                .type(NotificationMessage.Type.GENERAL)
                .title("Pong")
                .message("WebSocket connection is alive")
                .build();
    }
}
