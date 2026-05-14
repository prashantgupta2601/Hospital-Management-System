package com.hms.modules.notification.service;

import com.hms.modules.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Centralised WebSocket notification broadcaster.
 *
 * Topics published:
 *   /topic/appointments        – broadcast to ALL connected clients
 *   /topic/notifications       – global system notifications
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /** Broadcast an appointment event to every connected client */
    public void broadcastAppointmentUpdate(NotificationMessage notification) {
        log.info("Broadcasting appointment update [{}]: {}", notification.getType(), notification.getMessage());
        messagingTemplate.convertAndSend("/topic/appointments", notification);
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /** Send a general notification broadcast */
    public void broadcastNotification(NotificationMessage notification) {
        log.info("Broadcasting notification [{}]: {}", notification.getType(), notification.getMessage());
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
