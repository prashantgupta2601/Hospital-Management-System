package com.hms.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Generic real-time notification payload sent over WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {

    public enum Type {
        APPOINTMENT_CREATED,
        APPOINTMENT_UPDATED,
        APPOINTMENT_CANCELLED,
        APPOINTMENT_COMPLETED,
        GENERAL
    }

    /** Notification category */
    private Type type;

    /** Short title shown in the toast / notification bell */
    private String title;

    /** Longer description */
    private String message;

    /** Related entity id (e.g. appointment id) */
    private Long entityId;

    /** Timestamp the event was generated */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
